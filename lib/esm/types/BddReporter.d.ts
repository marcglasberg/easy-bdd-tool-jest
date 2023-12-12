import { Feature } from "./Feature";
import { BDD } from "./Bdd";
declare class _RunInfo {
    totalTestCount: number;
    testCount: number;
    skipCount: number;
    passedCount: number;
    failedCount: number;
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
export declare abstract class BddReporter {
    /** Subclasses must implement this. */
    abstract report(): Promise<void>;
    static runInfo: _RunInfo;
    private static _emptyFeature;
    static _reporters: BddReporter[];
    static yellow: string;
    static reset: string;
    static set(r1?: BddReporter, r2?: BddReporter, r3?: BddReporter, r4?: BddReporter, r5?: BddReporter): void;
    private static _reportAll;
    features: Set<Feature>;
    _addBdd(bdd: BDD): void;
    /** Keeps A-Z 0-9, make it lowercase, and change spaces into underline. */
    normalizeFileName(name: string): string;
}
export {};
//# sourceMappingURL=BddReporter.d.ts.map