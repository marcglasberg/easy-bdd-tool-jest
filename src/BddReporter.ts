import {Feature} from "./Feature";
import {afterAll} from "@jest/globals";
import {BDD} from "./Bdd";

class _RunInfo {
    totalTestCount: number = 0;
    testCount: number = 0;
    skipCount: number = 0;
    passedCount: number = 0;
    failedCount: number = 0;
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
export abstract class BddReporter {

    /** Subclasses must implement this. */
    abstract report(): Promise<void>;

    static runInfo = new _RunInfo();
    private static _emptyFeature = new Feature('');
    public static _reporters: BddReporter[] = [];
    static yellow: string = '\x1B[38;5;226m';
    static reset: string = '\u001b[0m';

    // Static method to set reporters.
    static set(r1?: BddReporter, r2?: BddReporter, r3?: BddReporter, r4?: BddReporter, r5?: BddReporter): void {
        BddReporter._reporters = [r1, r2, r3, r4, r5].filter(_reporter => _reporter !== undefined) as BddReporter[];
        BddReporter._reportAll();
    }

    private static _reportAll() {

        afterAll(async () => {

            // TODO: Move this to a Jest Custom Reporter?
            // console.log(
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
                // console.log(`Running the ${_reporter.constructor.name}...\n`);

                await _reporter.report();
            }
        });
    }

    features: Set<Feature> = new Set();

    public _addBdd(bdd: BDD): void {

        // Use the feature, if provided. Otherwise, use the "empty feature".
        let _feature = bdd.feature ?? BddReporter._emptyFeature;

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
    normalizeFileName(name: string): string {
        return name.trim().split('').map(char => {
            if (char === ' ') return '_';
            if (!/[A-Za-z0-9]/.test(char)) return '';
            return char.toLowerCase();
        }).join('');
    }
}

