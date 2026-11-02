"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_RUN_DATA_BYTES = void 0;
exports.featureGherkin = featureGherkin;
exports.readRunResults = readRunResults;
exports.summarize = summarize;
const fs_1 = require("fs");
const path_1 = require("path");
const gherkin_1 = require("./gherkin");
const runData_1 = require("./runData");
/** The largest data file of a test file that is read. */
exports.MAX_RUN_DATA_BYTES = 64 * 1024 * 1024;
/** The Gherkin text of the [feature], with the BDDs of all test files. */
function featureGherkin(feature) {
    return (0, gherkin_1.composeGherkin)(feature.header, feature.background, feature.bdds.map(bdd => bdd.scenario));
}
/** Reads the data recorded by the test files into [dir], and matches it with Jest's [results]. */
function readRunResults(dir, results) {
    return __awaiter(this, void 0, void 0, function* () {
        const problems = [];
        const files = [];
        const names = (yield fs_1.promises.readdir(dir)).filter(name => name.endsWith('.ndjson')).sort();
        for (const name of names) {
            const file = yield _readFile((0, path_1.join)(dir, name), problems);
            if (file)
                files.push(file);
        }
        files.sort((a, b) => (a.testPath < b.testPath ? -1 : a.testPath > b.testPath ? 1 : 0));
        _matchJestResults(files, results, problems);
        // Merge the features of all test files, by title.
        const features = new Map();
        for (const file of files) {
            const bdds = Array.from(file.bdds.values()).sort((a, b) => a.event.bdd - b.event.bdd);
            for (const { event, tests } of bdds) {
                const featureEvent = file.features.get(event.feature);
                if (!featureEvent) {
                    problems.push(`The feature of a BDD of ${file.testPath} was not recorded.`);
                    continue;
                }
                let feature = features.get(event.feature);
                if (!feature) {
                    feature = {
                        title: featureEvent.title,
                        header: featureEvent.header,
                        background: featureEvent.background,
                        bdds: [],
                        conflicts: [],
                    };
                    features.set(event.feature, feature);
                }
                else if ((feature.header !== featureEvent.header || feature.background !== featureEvent.background) &&
                    !feature.conflicts.includes(file.testPath)) {
                    feature.conflicts.push(file.testPath);
                }
                feature.bdds.push({
                    testPath: file.testPath,
                    id: event.bdd,
                    feature: event.feature,
                    scenario: event.scenario,
                    steps: event.steps,
                    codeCount: event.codeCount,
                    skip: event.skip,
                    only: event.only,
                    tests,
                });
            }
        }
        return { features: Array.from(features.values()), problems };
    });
}
function _readFile(path, problems) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const stats = yield fs_1.promises.lstat(path);
        if (!stats.isFile()) {
            problems.push(`${path} is not a regular file.`);
            return undefined;
        }
        if (stats.size > exports.MAX_RUN_DATA_BYTES) {
            problems.push(`${path} exceeds the 64 MiB limit.`);
            return undefined;
        }
        const lines = (yield fs_1.promises.readFile(path, 'utf-8')).split('\n');
        if (lines[lines.length - 1] === '')
            lines.pop();
        const data = { testPath: '', features: new Map(), bdds: new Map() };
        const attempts = new Map();
        for (let i = 0; i < lines.length; i++) {
            let event;
            try {
                event = JSON.parse(lines[i]);
            }
            catch (_b) {
                problems.push(`Line ${i + 1} of ${path} is not valid JSON.`);
                return undefined;
            }
            if (i === 0) {
                if (event.type !== 'file' || event.version !== runData_1.RUN_DATA_VERSION) {
                    problems.push(`${path} has an unsupported format.`);
                    return undefined;
                }
                if (!event.testPath) {
                    problems.push(`${path} doesn't say which test file it belongs to.`);
                    return undefined;
                }
                data.testPath = (0, path_1.resolve)(event.testPath);
                continue;
            }
            switch (event.type) {
                case 'feature':
                    data.features.set(event.title, event);
                    break;
                case 'bdd':
                    data.bdds.set(event.bdd, {
                        event,
                        tests: event.tests.map((name, index) => ({
                            name,
                            exampleIndex: event.hasExamples ? index : null,
                            attempts: [],
                            jestStatus: 'missing',
                            jestFailureMessages: [],
                        })),
                    });
                    break;
                case 'start': {
                    const test = (_a = data.bdds.get(event.bdd)) === null || _a === void 0 ? void 0 : _a.tests[event.test];
                    if (!test) {
                        problems.push(`${path} has a test that started before it was declared.`);
                        return undefined;
                    }
                    const attempt = {
                        attempt: event.attempt,
                        startedAt: event.startedAt,
                        finished: false,
                        codes: new Map(),
                    };
                    test.attempts.push(attempt);
                    attempts.set(`${event.bdd}/${event.test}/${event.attempt}`, attempt);
                    break;
                }
                case 'code':
                case 'end': {
                    const attempt = attempts.get(`${event.bdd}/${event.test}/${event.attempt}`);
                    if (!attempt) {
                        problems.push(`${path} has a result of a test that didn't start.`);
                        return undefined;
                    }
                    if (event.type === 'code') {
                        attempt.codes.set(event.code, { startedAt: event.startedAt, duration: event.duration, error: event.error });
                    }
                    else {
                        attempt.finished = true;
                        attempt.duration = event.duration;
                        attempt.error = event.error;
                    }
                    break;
                }
                default:
                    problems.push(`${path} has an unknown event.`);
                    return undefined;
            }
        }
        return data;
    });
}
/** Sets the Jest status of each test, and checks that it agrees with the recorded data. */
function _matchJestResults(files, results, problems) {
    var _a, _b;
    const jestFiles = new Map(results.testResults.map(result => [(0, path_1.resolve)(result.testFilePath), result]));
    // The same test file may have more than one data file, if its modules were reset.
    const namesByTestPath = new Map();
    for (const file of files) {
        const jestFile = jestFiles.get(file.testPath);
        if (jestFile === null || jestFile === void 0 ? void 0 : jestFile.testExecError) {
            problems.push(`The test file ${file.testPath} failed to run: ${jestFile.testExecError.message}`);
        }
        const names = (_a = namesByTestPath.get(file.testPath)) !== null && _a !== void 0 ? _a : new Set();
        namesByTestPath.set(file.testPath, names);
        for (const { tests } of Array.from(file.bdds.values())) {
            for (const test of tests) {
                if (names.has(test.name)) {
                    problems.push(`The test file ${file.testPath} has more than one test named "${test.name}".`);
                }
                names.add(test.name);
                const assertions = (_b = jestFile === null || jestFile === void 0 ? void 0 : jestFile.testResults.filter(result => result.title === test.name)) !== null && _b !== void 0 ? _b : [];
                if (assertions.length > 1) {
                    problems.push(`Jest has more than one test named "${test.name}" in ${file.testPath}.`);
                }
                const assertion = assertions[0];
                test.jestStatus = !assertion
                    ? 'missing'
                    : assertion.status === 'passed'
                        ? 'passed'
                        : assertion.status === 'failed'
                            ? 'failed'
                            : 'skipped';
                test.jestFailureMessages = assertion ? [...assertion.failureMessages] : [];
                const last = _lastAttempt(test);
                const where = `"${test.name}" in ${file.testPath}`;
                if (test.jestStatus === 'passed' && !((last === null || last === void 0 ? void 0 : last.finished) && last.error === undefined)) {
                    problems.push(`Jest says ${where} passed, but its last recorded attempt didn't pass.`);
                }
                else if ((test.jestStatus === 'skipped' || test.jestStatus === 'missing') && last) {
                    problems.push(`Jest has no result for ${where}, but it ran.`);
                }
                // A test may fail without running its BDD code, for example when a `beforeEach` fails.
            }
        }
    }
}
function _lastAttempt(test) {
    return test.attempts.reduce((last, attempt) => (!last || attempt.attempt > last.attempt ? attempt : last), undefined);
}
/** Counts the BDD tests by their Jest status. Tests Jest didn't run (or has no result for) are skipped. */
function summarize(results) {
    const summary = { bdds: 0, tests: 0, passed: 0, failed: 0, skipped: 0 };
    for (const feature of results.features) {
        for (const bdd of feature.bdds) {
            summary.bdds++;
            for (const test of bdd.tests) {
                summary.tests++;
                if (test.jestStatus === 'passed')
                    summary.passed++;
                else if (test.jestStatus === 'failed')
                    summary.failed++;
                else
                    summary.skipped++;
            }
        }
    }
    return summary;
}
