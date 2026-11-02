import type { JestResults } from './runResults';
/**
 * The options of the [JestReporter], given in the Jest configuration. Example:
 *
 * ```
 * reporters: [
 *   'default',
 *   ['easy-bdd-tool-jest/jest-reporter', {
 *     featureFiles: { clearAllOutputBeforeRun: true },
 *     cucumberResults: true,
 *   }],
 * ],
 * ```
 *
 * Relative paths are relative to Jest's `rootDir`.
 */
export interface JestReporterOptions {
    /** Prints a summary of the BDD results of the whole run. The default is `true`. */
    summary?: boolean;
    /**
     * Writes one Gherkin `.feature` file for each feature, with the BDDs of all test files.
     * The default directory is `./gen_features/`. If `clearAllOutputBeforeRun` is true, the
     * `.feature` files directly inside the directory are deleted before the new ones are written.
     */
    featureFiles?: boolean | {
        dir?: string;
        clearAllOutputBeforeRun?: boolean;
    };
    /**
     * Writes the results in Cucumber's standard format, Cucumber Messages (NDJSON).
     * The default file is `./gen_cucumber_results/results.ndjson`.
     */
    cucumberResults?: boolean | {
        outputFile?: string;
    };
}
/** The parts of Jest's `AggregatedResult` that are used here. */
interface _AggregatedResult extends JestResults {
    numFailedTests: number;
    numRuntimeErrorTestSuites: number;
    wasInterrupted?: boolean;
    runExecError?: unknown;
    snapshot?: {
        failure?: boolean;
    };
}
/**
 * A Jest reporter for the BDDs of all test files of a Jest run. It prints a summary of the
 * results, and may write the feature files and the Cucumber results. Add it to the `reporters`
 * of your Jest configuration (see [JestReporterOptions]).
 *
 * Jest runs each test file separately. This reporter runs in Jest's main process, and sees
 * the BDDs of all test files: while the tests run, each test file records its BDDs and their
 * results in a temporary directory, which the reporter reads after all tests finish.
 */
export declare class JestReporter {
    private readonly _summary;
    private readonly _featureDir?;
    private readonly _clearFeatureFiles;
    private readonly _cucumberFile?;
    private _runDir?;
    private _cucumberError?;
    private _lastError?;
    constructor(globalConfig: {
        rootDir: string;
    }, options?: JestReporterOptions);
    onRunStart(): Promise<void>;
    onRunComplete(_testContexts: unknown, results: _AggregatedResult): Promise<void>;
    /** Jest fails the run when a reporter has an error. */
    getLastError(): Error | undefined;
    private _printSummary;
    private _writeFeatureFiles;
    private _writeCucumberResults;
}
export default JestReporter;
//# sourceMappingURL=jest-reporter.d.ts.map