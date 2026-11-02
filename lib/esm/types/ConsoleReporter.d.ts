import { BddReporter } from './BddReporter';
import { Config } from './Config';
/** Prints the features and their BDDs to the console, after all tests of the test file run. */
export declare class ConsoleReporter extends BddReporter {
    static config: Config;
    report(): Promise<void>;
}
//# sourceMappingURL=ConsoleReporter.d.ts.map