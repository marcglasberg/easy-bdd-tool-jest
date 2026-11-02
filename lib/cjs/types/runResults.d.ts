import type { ErrorData, StepData } from './runData';
/** The largest data file of a test file that is read. */
export declare const MAX_RUN_DATA_BYTES: number;
/** The result of one code block, in one attempt. */
export interface CodeResult {
    startedAt: number;
    duration: number;
    error?: ErrorData;
}
/** One attempt of one test. */
export interface AttemptResult {
    attempt: number;
    /** Milliseconds since the epoch. */
    startedAt: number;
    /** False if it never finished (for example, it timed out). */
    finished: boolean;
    duration?: number;
    error?: ErrorData;
    /** The results of the code blocks that finished, by index. */
    codes: Map<number, CodeResult>;
}
/** The final status Jest gave to a test. `missing` means Jest has no result for it. */
export type JestStatus = 'passed' | 'failed' | 'skipped' | 'missing';
/** One Jest test: a BDD without examples, or one example row. */
export interface TestRecord {
    name: string;
    /** The index of the example row, or `null` if the BDD has no examples. */
    exampleIndex: number | null;
    attempts: AttemptResult[];
    jestStatus: JestStatus;
    jestFailureMessages: string[];
}
export interface BddRecord {
    testPath: string;
    id: number;
    feature: string;
    scenario: string;
    steps: StepData[];
    codeCount: number;
    skip: boolean;
    only: boolean;
    tests: TestRecord[];
}
export interface FeatureRecord {
    title: string;
    header: string;
    background: string | null;
    bdds: BddRecord[];
    /** The test files where this feature has a different title, description or background. */
    conflicts: string[];
}
export interface RunResults {
    /** The features of all test files, in the order of the test files (sorted by path). */
    features: FeatureRecord[];
    /**
     * Problems that make the results unverifiable, like recorded data that doesn't match
     * what Jest says. They don't affect the summary or the feature files.
     */
    problems: string[];
}
/** The parts of Jest's results that are used here (see `AggregatedResult` in `@jest/test-result`). */
export interface JestResults {
    testResults: readonly {
        testFilePath: string;
        testExecError?: {
            message: string;
        } | null;
        testResults: readonly {
            title: string;
            status: string;
            failureMessages: readonly string[];
        }[];
    }[];
}
/** The Gherkin text of the [feature], with the BDDs of all test files. */
export declare function featureGherkin(feature: FeatureRecord): string;
/** Reads the data recorded by the test files into [dir], and matches it with Jest's [results]. */
export declare function readRunResults(dir: string, results: JestResults): Promise<RunResults>;
/** The counts of the summary. */
export interface Summary {
    bdds: number;
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
}
/** Counts the BDD tests by their Jest status. Tests Jest didn't run (or has no result for) are skipped. */
export declare function summarize(results: RunResults): Summary;
//# sourceMappingURL=runResults.d.ts.map