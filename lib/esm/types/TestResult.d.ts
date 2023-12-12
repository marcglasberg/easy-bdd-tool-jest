import { Config } from "./Config";
import { BDD, Term } from "./Bdd";
export declare class TestResult {
    private _bdd;
    constructor(bdd: BDD);
    get terms(): Iterable<Term>;
    toMap(config?: Config): string[];
    toString(config?: Config): string;
    get wasSkipped(): boolean;
    /**
     * Empty means the test was not run yet.
     * If the Bdd has no examples, the result will be a single value.
     * Otherwise, it will have one result for each example.
     *
     * For each value:
     * True values means it passed.
     * False values means it did not pass.
     */
    get passed(): boolean[];
}
//# sourceMappingURL=TestResult.d.ts.map