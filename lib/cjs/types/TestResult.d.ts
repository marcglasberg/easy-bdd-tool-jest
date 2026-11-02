import { Config } from './Config';
import type { BDD, Term } from './Bdd';
import type { BddExecution } from './BddExecution';
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
    /** Each run of the BDD, with the result of each code block. See [BddExecution]. */
    get executions(): BddExecution[];
}
//# sourceMappingURL=TestResult.d.ts.map