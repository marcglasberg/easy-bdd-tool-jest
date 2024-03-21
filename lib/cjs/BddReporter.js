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
exports.BddReporter = void 0;
const Feature_1 = require("./Feature");
const globals_1 = require("@jest/globals");
class _RunInfo {
    constructor() {
        this.totalTestCount = 0;
        this.testCount = 0;
        this.skipCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
    }
}
/**
 * Example:
 *
 * ```
 * void main() async {
 *   BddReporter.set(ConsoleReporter(), FeatureFileReporter());
 *   group('favorites_test', favorites_test.main);
 *   group('search_test', search_test.main);
 *   await BddReporter.reportAll();
 * }
 * ```
 */
class BddReporter {
    constructor() {
        this.features = new Set();
    }
    // Static method to set reporters.
    static set(r1, r2, r3, r4, r5) {
        BddReporter._reporters = [r1, r2, r3, r4, r5].filter(_reporter => _reporter !== undefined);
        BddReporter._reportAll();
    }
    static _reportAll() {
        (0, globals_1.afterAll)(() => __awaiter(this, void 0, void 0, function* () {
            // TODO: Move this to a Jest Custom Reporter?
            // process.stdout.write(
            //   `${this.yellow}\n` +
            //   'RESULTS ════════════════════════════════════════════════\n' +
            //   `TOTAL: ${this.runInfo.totalTestCount} tests (${this.runInfo.testCount} BDDs)\n` +
            //   `PASSED: ${this.runInfo.passedCount} tests\n` +
            //   `FAILED: ${this.runInfo.failedCount} tests\n` +
            //   `SKIPPED: ${this.runInfo.skipCount} tests\n` +
            //   `══════════════════════════════════════════════════════${this.reset}\n\n`,
            // );
            for (const _reporter of this._reporters) {
                // TODO: Move this to a Jest Custom Reporter?
                // process.stdout.write(`Running the ${_reporter.constructor.name}...\n`);
                yield _reporter.report();
            }
        }));
    }
    _addBdd(bdd) {
        var _a;
        // Use the feature, if provided. Otherwise, use the "empty feature".
        let _feature = (_a = bdd.feature) !== null && _a !== void 0 ? _a : BddReporter._emptyFeature;
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
    /** Keeps A-Z 0-9, make it lowercase, and change spaces into underline. */
    normalizeFileName(name) {
        return name.trim().split('').map(char => {
            if (char === ' ')
                return '_';
            if (!/[A-Za-z0-9]/.test(char))
                return '';
            return char.toLowerCase();
        }).join('');
    }
}
exports.BddReporter = BddReporter;
BddReporter.runInfo = new _RunInfo();
BddReporter._emptyFeature = new Feature_1.Feature('');
BddReporter._reporters = [];
BddReporter.yellow = '\x1B[38;5;226m';
BddReporter.reset = '\u001b[0m';
