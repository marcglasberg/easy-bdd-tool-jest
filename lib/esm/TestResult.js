import { Config } from "./Config";
export class TestResult {
    _bdd;
    constructor(bdd) {
        this._bdd = bdd;
    }
    get terms() {
        return this._bdd.textTerms;
    }
    toMap(config = Config._default) {
        return this._bdd.toMap(config);
    }
    toString(config = Config._default) {
        return this._bdd.toString(config);
    }
    get wasSkipped() {
        return this._bdd._skip;
    }
    /**
     * Empty means the test was not run yet.
     * If the Bdd has no examples, the result will be a single value.
     * Otherwise, it will have one result for each example.
     *
     * For each value:
     * True values means it passed.
     * False values means it did not pass.
     */
    get passed() {
        return this._bdd.passed;
    }
}
