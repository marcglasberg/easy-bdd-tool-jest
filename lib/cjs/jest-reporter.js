"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.JestReporter = void 0;
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const os_1 = require("os");
const path_1 = require("path");
const gherkin_1 = require("./gherkin");
const runData_1 = require("./runData");
const runResults_1 = require("./runResults");
/**
 * A Jest reporter for the BDDs of all test files of a Jest run. It prints a summary of the
 * results, and may write the feature files and the Cucumber results. Add it to the `reporters`
 * of your Jest configuration (see [JestReporterOptions]).
 *
 * Jest runs each test file separately. This reporter runs in Jest's main process, and sees
 * the BDDs of all test files: while the tests run, each test file records its BDDs and their
 * results in a temporary directory, which the reporter reads after all tests finish.
 */
class JestReporter {
    constructor(globalConfig, options = {}) {
        var _a;
        const rootDir = globalConfig.rootDir;
        this._summary = (_a = options.summary) !== null && _a !== void 0 ? _a : true;
        const featureFiles = options.featureFiles;
        if (featureFiles) {
            const dir = (typeof featureFiles === 'object' && featureFiles.dir) || './gen_features/';
            this._featureDir = (0, path_1.resolve)(rootDir, dir);
            this._clearFeatureFiles = typeof featureFiles === 'object' && !!featureFiles.clearAllOutputBeforeRun;
        }
        else {
            this._clearFeatureFiles = false;
        }
        const cucumber = options.cucumberResults;
        if (cucumber) {
            const file = (typeof cucumber === 'object' && cucumber.outputFile) || './gen_cucumber_results/results.ndjson';
            this._cucumberFile = (0, path_1.resolve)(rootDir, file);
        }
    }
    onRunStart() {
        return __awaiter(this, void 0, void 0, function* () {
            this._lastError = undefined;
            this._cucumberError = undefined;
            // The test files record their BDDs here. Jest starts the test files after this,
            // so they inherit the environment variable.
            this._runDir = yield fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'easy-bdd-tool-jest-'));
            process.env[runData_1.RUN_DIR_ENV] = this._runDir;
            // An old report must never look like the result of this run.
            if (this._cucumberFile) {
                const { invalidateOutput } = yield Promise.resolve().then(() => __importStar(require('./cucumber/output')));
                yield invalidateOutput(this._cucumberFile).catch(error => (this._cucumberError = error));
            }
        });
    }
    onRunComplete(_testContexts, results) {
        return __awaiter(this, void 0, void 0, function* () {
            const runDir = this._runDir;
            this._runDir = undefined;
            if (process.env[runData_1.RUN_DIR_ENV] === runDir)
                delete process.env[runData_1.RUN_DIR_ENV];
            if (!runDir)
                return;
            try {
                if (results.wasInterrupted) {
                    process.stdout.write('\nThe run was interrupted. The BDD reports were not written.\n');
                    return;
                }
                const runResults = yield (0, runResults_1.readRunResults)(runDir, results);
                if (runResults.features.length === 0 && runResults.problems.length === 0)
                    return;
                if (this._summary)
                    this._printSummary(runResults);
                if (this._featureDir)
                    yield this._writeFeatureFiles(runResults, this._featureDir);
                if (this._cucumberFile)
                    yield this._writeCucumberResults(runResults, results, this._cucumberFile);
            }
            catch (error) {
                this._lastError = error instanceof Error ? error : new Error(String(error));
                process.stderr.write(`\neasy-bdd-tool-jest: ${this._lastError.message}\n`);
            }
            finally {
                yield fs_1.promises.rm(runDir, { recursive: true, force: true }).catch(() => undefined);
            }
        });
    }
    /** Jest fails the run when a reporter has an error. */
    getLastError() {
        return this._lastError;
    }
    _printSummary(runResults) {
        const summary = (0, runResults_1.summarize)(runResults);
        process.stdout.write(`\n${_yellow}` +
            'BDD RESULTS ══════════════════════════════════════════\n' +
            `TOTAL: ${summary.tests} tests (${summary.bdds} BDDs)\n` +
            `PASSED: ${summary.passed} tests\n` +
            `FAILED: ${summary.failed} tests\n` +
            `SKIPPED: ${summary.skipped} tests\n` +
            `══════════════════════════════════════════════════════${_reset}\n\n`);
    }
    _writeFeatureFiles(runResults, dir) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._clearFeatureFiles)
                yield _deleteFeatureFiles(dir);
            yield fs_1.promises.mkdir(dir, { recursive: true });
            const written = new Map();
            for (const feature of runResults.features) {
                const fileName = `${(0, gherkin_1.featureFileName)(feature.title)}.feature`;
                const other = written.get(fileName);
                if (other !== undefined) {
                    process.stdout.write(`Warning: The features "${other}" and "${feature.title}" are both written to ${fileName}.\n`);
                }
                if (feature.conflicts.length > 0) {
                    process.stdout.write(`Warning: The feature "${feature.title}" has a different description or Background in ` +
                        `${feature.conflicts.join(', ')}. The first one was used.\n`);
                }
                written.set(fileName, feature.title);
                yield fs_1.promises.writeFile((0, path_1.join)(dir, fileName), (0, runResults_1.featureGherkin)(feature), 'utf-8');
            }
            process.stdout.write(`Feature files saved in ${dir}\n`);
        });
    }
    _writeCucumberResults(runResults, results, outputFile) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this._cucumberError !== undefined)
                throw this._cucumberError;
            // Loaded only when used, since it needs the @cucumber packages.
            const { buildCucumberMessages } = yield Promise.resolve().then(() => __importStar(require('./cucumber/CucumberMessages')));
            const { writeOutput } = yield Promise.resolve().then(() => __importStar(require('./cucumber/output')));
            const success = results.numFailedTests === 0 &&
                results.numRuntimeErrorTestSuites === 0 &&
                !((_a = results.snapshot) === null || _a === void 0 ? void 0 : _a.failure) &&
                !results.runExecError;
            const envelopes = buildCucumberMessages(runResults, { runId: (0, crypto_1.randomBytes)(32).toString('hex'), success });
            yield writeOutput(outputFile, envelopes.map(envelope => JSON.stringify(envelope)));
            process.stdout.write(`Cucumber results saved in ${outputFile}\n`);
        });
    }
}
exports.JestReporter = JestReporter;
/** Deletes only the `.feature` files directly inside the [dir]. Other files, subdirectories and links are kept. */
function _deleteFeatureFiles(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        let entries;
        try {
            entries = yield fs_1.promises.readdir(dir, { withFileTypes: true });
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) === 'ENOENT')
                return;
            throw error;
        }
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.feature'))
                yield fs_1.promises.unlink((0, path_1.join)(dir, entry.name));
        }
    });
}
const _yellow = '\x1B[38;5;226m';
const _reset = '\u001b[0m';
exports.default = JestReporter;
