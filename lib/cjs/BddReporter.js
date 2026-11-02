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
exports.BddReporter = exports.RunInfo = void 0;
const Feature_1 = require("./Feature");
const BddRunner_1 = require("./BddRunner");
const gherkin_1 = require("./gherkin");
/**
 * Counts the tests of the current test file. Note that Jest runs each test file
 * separately, so these numbers are for the current test file only.
 */
class RunInfo {
    constructor() {
        /** The number of tests: one for each BDD without examples, and one for each example row. */
        this.totalTestCount = 0;
        /** The number of BDDs. */
        this.testCount = 0;
        this._results = new Map();
    }
    /** The tests that passed (in their last attempt, if they were retried). */
    get passedCount() {
        return this._count('passed');
    }
    /**
     * The tests that failed (in their last attempt, if they were retried).
     * A test that started but never finished, because it timed out, also failed.
     */
    get failedCount() {
        return this._count('failed') + this._count('running');
    }
    /** The tests that didn't run. For example, because of `.skip`, or `.only` in another BDD. */
    get skipCount() {
        return this.totalTestCount - this._results.size;
    }
    /** @internal */
    _setResult(testId, status) {
        this._results.set(testId, status);
    }
    _count(status) {
        return Array.from(this._results.values()).filter(s => s === status).length;
    }
}
exports.RunInfo = RunInfo;
/**
 * Extend this class to create your own reporters. Set the reporters at the top of your
 * test file, with `reporter(...)` or `BddReporter.set(...)`. Example:
 *
 * ```
 * reporter(new ConsoleReporter(), new FeatureFileReporter());
 *
 * const feature = new Feature('Buying and Selling Stocks');
 * Bdd(feature)...
 * ```
 *
 * After all tests of the test file run, a summary of the results is printed,
 * and then each reporter's [report] method is called.
 */
class BddReporter {
    constructor() {
        this.features = new Set();
    }
    /**
     * Sets the reporters. After all tests of the test file run, a summary of the results
     * is printed, and then each reporter's [report] method is called.
     * Calling this again replaces the reporters.
     */
    static set(r1, r2, r3, r4, r5) {
        BddReporter._reporters = [r1, r2, r3, r4, r5].filter(_reporter => _reporter !== undefined);
        // Only once, even if `set` is called again.
        if (!BddReporter._isReportingSetUp) {
            BddReporter._isReportingSetUp = true;
            BddRunner_1.BddRunner.framework.afterAll(() => BddReporter._reportAll());
        }
    }
    static _reportAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const runInfo = BddReporter.runInfo;
            process.stdout.write(`${BddReporter.yellow}\n` +
                'RESULTS ══════════════════════════════════════════════\n' +
                `TOTAL: ${runInfo.totalTestCount} tests (${runInfo.testCount} BDDs)\n` +
                `PASSED: ${runInfo.passedCount} tests\n` +
                `FAILED: ${runInfo.failedCount} tests\n` +
                `SKIPPED: ${runInfo.skipCount} tests\n` +
                `══════════════════════════════════════════════════════${BddReporter.reset}\n\n`);
            for (const _reporter of BddReporter._reporters) {
                process.stdout.write(`Running the ${_reporter.constructor.name}...\n`);
                yield _reporter.report();
            }
        });
    }
    _addBdd(bdd) {
        var _a, _b;
        // Use the feature, if provided. Otherwise, use the "empty feature".
        const _feature = (_a = bdd.feature) !== null && _a !== void 0 ? _a : ((_b = BddReporter._emptyFeature) !== null && _b !== void 0 ? _b : (BddReporter._emptyFeature = new Feature_1.Feature('')));
        // We must find out if we already have a feature with the given title.
        // If we do, use the one we already have.
        let feature = Array.from(this.features).find(f => f.title === _feature.title);
        // If we don't, use the new one provided, and put it in the features set.
        if (feature === undefined) {
            feature = _feature;
            this.features.add(feature);
        }
        // Add the bdd to the feature.
        feature.add(bdd);
    }
    /**
     * Turns the feature title into a file name: line breaks and spaces become `_`,
     * some punctuation is removed, and the rest is lowercase. Letters with accents,
     * and letters of other alphabets, are kept.
     */
    normalizeFileName(name) {
        return (0, gherkin_1.featureFileName)(name);
    }
}
exports.BddReporter = BddReporter;
BddReporter.runInfo = new RunInfo();
BddReporter._reporters = [];
BddReporter._isReportingSetUp = false;
BddReporter.yellow = '\x1B[38;5;226m';
BddReporter.reset = '\u001b[0m';
