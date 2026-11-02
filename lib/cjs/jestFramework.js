"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jestFramework = void 0;
const globals_1 = require("@jest/globals");
/** Declares the BDDs as Jest tests. This is the default [TestFramework]. */
exports.jestFramework = {
    test(invocation) {
        // A test marked with both `.skip` and `.only` is skipped.
        const declare = invocation.skip ? globals_1.test.skip : invocation.only ? globals_1.test.only : globals_1.test;
        declare(invocation.description, invocation.body, invocation.timeout);
    },
    afterAll(fn) {
        (0, globals_1.afterAll)(fn);
    },
    testPath() {
        return globals_1.expect.getState().testPath;
    },
};
