import { Feature } from './Feature';
import type { BDD } from './Bdd';
type _TestStatus = 'running' | 'passed' | 'failed';
/**
 * Counts the tests of the current test file. Note that Jest runs each test file
 * separately, so these numbers are for the current test file only.
 */
export declare class RunInfo {
    /** The number of tests: one for each BDD without examples, and one for each example row. */
    totalTestCount: number;
    /** The number of BDDs. */
    testCount: number;
    private readonly _results;
    /** The tests that passed (in their last attempt, if they were retried). */
    get passedCount(): number;
    /**
     * The tests that failed (in their last attempt, if they were retried).
     * A test that started but never finished, because it timed out, also failed.
     */
    get failedCount(): number;
    /** The tests that didn't run. For example, because of `.skip`, or `.only` in another BDD. */
    get skipCount(): number;
    /** @internal */
    _setResult(testId: number, status: _TestStatus): void;
    private _count;
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
export declare abstract class BddReporter {
    /** Subclasses must implement this. */
    abstract report(): Promise<void>;
    static runInfo: RunInfo;
    private static _emptyFeature?;
    static _reporters: BddReporter[];
    private static _isReportingSetUp;
    static yellow: string;
    static reset: string;
    /**
     * Sets the reporters. After all tests of the test file run, a summary of the results
     * is printed, and then each reporter's [report] method is called.
     * Calling this again replaces the reporters.
     */
    static set(r1?: BddReporter, r2?: BddReporter, r3?: BddReporter, r4?: BddReporter, r5?: BddReporter): void;
    private static _reportAll;
    features: Set<Feature>;
    _addBdd(bdd: BDD): void;
    /**
     * Turns the feature title into a file name: line breaks and spaces become `_`,
     * some punctuation is removed, and the rest is lowercase. Letters with accents,
     * and letters of other alphabets, are kept.
     */
    normalizeFileName(name: string): string;
}
export {};
//# sourceMappingURL=BddReporter.d.ts.map