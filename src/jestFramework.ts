import { afterAll, expect, test } from '@jest/globals';
import type { TestFramework, TestInvocation } from './TestFramework';

/** Declares the BDDs as Jest tests. This is the default [TestFramework]. */
export const jestFramework: TestFramework = {
  test(invocation: TestInvocation): void {
    // A test marked with both `.skip` and `.only` is skipped.
    const declare = invocation.skip ? test.skip : invocation.only ? test.only : test;
    declare(invocation.description, invocation.body, invocation.timeout);
  },

  afterAll(fn: () => Promise<void> | void): void {
    afterAll(fn);
  },

  testPath(): string | undefined {
    return expect.getState().testPath;
  },
};
