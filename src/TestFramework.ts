/**
 * A test to be declared in the test framework (Jest, by default).
 * See [TestFramework].
 */
export interface TestInvocation {
  /** The test name, like `3₂ Buying stocks.` */
  readonly description: string;

  /** Runs the BDD. Rejects if the BDD fails. */
  readonly body: () => Promise<void>;

  /** Timeout in milliseconds, or `undefined` for the framework's default. */
  readonly timeout?: number;

  /** The test must be declared as skipped. */
  readonly skip: boolean;

  /**
   * Only this test, and the other tests marked with `only`, should run in this test file.
   * Set by `Bdd(feature).only`.
   */
  readonly only: boolean;
}

/**
 * Connects the BDDs to the test framework that actually runs them.
 *
 * The BDD core only declares tests and "after all" hooks through this interface,
 * so it doesn't depend on Jest itself. The default is [jestFramework]. To run the
 * BDDs with another framework, set `BddRunner.framework` to your own implementation
 * before declaring the BDDs.
 */
export interface TestFramework {
  /** Declares one test. */
  test(invocation: TestInvocation): void;

  /** Registers code to run after all tests of the current test file. */
  afterAll(fn: () => Promise<void> | void): void;

  /** The absolute path of the current test file, if known. */
  testPath?(): string | undefined;
}
