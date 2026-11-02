import type { Envelope } from '@cucumber/messages';
import type { RunResults } from '../runResults';
/** The most messages a report may have. */
export declare const MAX_ENVELOPES = 100000;
/** The most test attempts a report may have. */
export declare const MAX_RUNS = 10000;
export interface CucumberMessagesOptions {
    /** The id of the test run. */
    runId: string;
    /** The result of the whole Jest run, including tests that are not BDDs. */
    success: boolean;
    /** When the run finished, in milliseconds since the epoch. The default is now. */
    finishedAt?: number;
}
/**
 * Builds the Cucumber Messages of the [results]: the Gherkin of each feature, its test cases
 * (one per BDD, or per example row), and what happened in each attempt of each test case.
 *
 * Throws if the results can't be reported faithfully, for example if the Gherkin is invalid,
 * if the BDDs don't match their Gherkin scenarios, or if the recorded data doesn't agree with
 * what Jest says. No BDD is silently left out.
 */
export declare function buildCucumberMessages(results: RunResults, options: CucumberMessagesOptions): Envelope[];
//# sourceMappingURL=CucumberMessages.d.ts.map