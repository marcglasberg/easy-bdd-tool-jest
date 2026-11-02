import { Config } from './Config';
import type { BDD, Term } from './Bdd';
import type { BddExecution } from './BddExecution';

export class TestResult {
  private _bdd: BDD;

  constructor(bdd: BDD) {
    this._bdd = bdd;
  }

  get terms(): Iterable<Term> {
    return this._bdd.textTerms;
  }

  toMap(config: Config = Config._default): string[] {
    return this._bdd.toMap(config);
  }

  toString(config: Config = Config._default): string {
    return this._bdd.toString(config);
  }

  get wasSkipped(): boolean {
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
  get passed(): boolean[] {
    return this._bdd.passed;
  }

  /** Each run of the BDD, with the result of each code block. See [BddExecution]. */
  get executions(): BddExecution[] {
    return this._bdd.executions;
  }
}
