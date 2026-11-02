import { Feature } from './Feature';
import type { BDD } from './Bdd';
import { BddRunner } from './BddRunner';
import { featureFileName } from './gherkin';

type _TestStatus = 'running' | 'passed' | 'failed';

/**
 * Counts the tests of the current test file. Note that Jest runs each test file
 * separately, so these numbers are for the current test file only.
 */
export class RunInfo {
  /** The number of tests: one for each BDD without examples, and one for each example row. */
  totalTestCount: number = 0;

  /** The number of BDDs. */
  testCount: number = 0;

  private readonly _results = new Map<number, _TestStatus>();

  /** The tests that passed (in their last attempt, if they were retried). */
  get passedCount(): number {
    return this._count('passed');
  }

  /**
   * The tests that failed (in their last attempt, if they were retried).
   * A test that started but never finished, because it timed out, also failed.
   */
  get failedCount(): number {
    return this._count('failed') + this._count('running');
  }

  /** The tests that didn't run. For example, because of `.skip`, or `.only` in another BDD. */
  get skipCount(): number {
    return this.totalTestCount - this._results.size;
  }

  /** @internal */
  _setResult(testId: number, status: _TestStatus): void {
    this._results.set(testId, status);
  }

  private _count(status: _TestStatus): number {
    return Array.from(this._results.values()).filter(s => s === status).length;
  }
}

/**
 * Extend this class to create your own reporters. Set the reporters at the top of your
 * test file, with `reporter(...)` or `BddReporter.set(...)`. Example:
 *
 * ```
 * reporter(new ConsoleReporter(), new FeatureFileReporter());
 *
 * const feature = new Feature('Buying and Selling Stocks');
 * Bdd(feature)...
 * ```
 *
 * After all tests of the test file run, a summary of the results is printed,
 * and then each reporter's [report] method is called.
 */
export abstract class BddReporter {
  /** Subclasses must implement this. */
  abstract report(): Promise<void>;

  static runInfo = new RunInfo();
  private static _emptyFeature?: Feature;
  public static _reporters: BddReporter[] = [];
  private static _isReportingSetUp = false;
  static yellow: string = '\x1B[38;5;226m';
  static reset: string = '\u001b[0m';

  /**
   * Sets the reporters. After all tests of the test file run, a summary of the results
   * is printed, and then each reporter's [report] method is called.
   * Calling this again replaces the reporters.
   */
  static set(r1?: BddReporter, r2?: BddReporter, r3?: BddReporter, r4?: BddReporter, r5?: BddReporter): void {
    BddReporter._reporters = [r1, r2, r3, r4, r5].filter(_reporter => _reporter !== undefined) as BddReporter[];

    // Only once, even if `set` is called again.
    if (!BddReporter._isReportingSetUp) {
      BddReporter._isReportingSetUp = true;
      BddRunner.framework.afterAll(() => BddReporter._reportAll());
    }
  }

  private static async _reportAll(): Promise<void> {
    const runInfo = BddReporter.runInfo;

    process.stdout.write(
      `${BddReporter.yellow}\n` +
        'RESULTS ══════════════════════════════════════════════\n' +
        `TOTAL: ${runInfo.totalTestCount} tests (${runInfo.testCount} BDDs)\n` +
        `PASSED: ${runInfo.passedCount} tests\n` +
        `FAILED: ${runInfo.failedCount} tests\n` +
        `SKIPPED: ${runInfo.skipCount} tests\n` +
        `══════════════════════════════════════════════════════${BddReporter.reset}\n\n`,
    );

    for (const _reporter of BddReporter._reporters) {
      process.stdout.write(`Running the ${_reporter.constructor.name}...\n`);
      await _reporter.report();
    }
  }

  features: Set<Feature> = new Set();

  public _addBdd(bdd: BDD): void {
    // Use the feature, if provided. Otherwise, use the "empty feature".
    const _feature = bdd.feature ?? (BddReporter._emptyFeature ??= new Feature(''));

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

  /**
   * Turns the feature title into a file name: line breaks and spaces become `_`,
   * some punctuation is removed, and the rest is lowercase. Letters with accents,
   * and letters of other alphabets, are kept.
   */
  normalizeFileName(name: string): string {
    return featureFileName(name);
  }
}
