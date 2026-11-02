import { Feature } from './Feature';
import { BddRunner } from './BddRunner';
import { featureFileName } from './gherkin';
/**
 * Counts the tests of the current test file. Note that Jest runs each test file
 * separately, so these numbers are for the current test file only.
 */
export class RunInfo {
    /** The number of tests: one for each BDD without examples, and one for each example row. */
    totalTestCount = 0;
    /** The number of BDDs. */
    testCount = 0;
    _results = new Map();
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
export class BddReporter {
    static runInfo = new RunInfo();
    static _emptyFeature;
    static _reporters = [];
    static _isReportingSetUp = false;
    static yellow = '\x1B[38;5;226m';
    static reset = '\u001b[0m';
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
            BddRunner.framework.afterAll(() => BddReporter._reportAll());
        }
    }
    static async _reportAll() {
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
            await _reporter.report();
        }
    }
    features = new Set();
    _addBdd(bdd) {
        // Use the feature, if provided. Otherwise, use the "empty feature".
        const _feature = bdd.feature ?? (BddReporter._emptyFeature ??= new Feature(''));
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
        return featureFileName(name);
    }
}
