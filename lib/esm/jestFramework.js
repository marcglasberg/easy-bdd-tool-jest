import { afterAll, expect, test } from '@jest/globals';
/** Declares the BDDs as Jest tests. This is the default [TestFramework]. */
export const jestFramework = {
    test(invocation) {
        // A test marked with both `.skip` and `.only` is skipped.
        const declare = invocation.skip ? test.skip : invocation.only ? test.only : test;
        declare(invocation.description, invocation.body, invocation.timeout);
    },
    afterAll(fn) {
        afterAll(fn);
    },
    testPath() {
        return expect.getState().testPath;
    },
};
