"use strict";
// The data each test file records for the `JestReporter`, which runs in Jest's main process.
//
// When the `JestReporter` is used, it creates a temporary directory for the run, and
// puts its path in the RUN_DIR_ENV environment variable before Jest starts the test
// files. Each test file then writes one NDJSON file into that directory, with one
// `RunEvent` per line.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUN_DATA_VERSION = exports.RUN_DIR_ENV = void 0;
exports.errorData = errorData;
/** The environment variable with the directory where the test files record their BDDs. */
exports.RUN_DIR_ENV = 'EASY_BDD_TOOL_JEST_RUN_DIR';
/** The version of the format of the recorded data. */
exports.RUN_DATA_VERSION = 1;
/** Converts anything thrown into an [ErrorData]. */
function errorData(error) {
    var _a;
    if (error instanceof Error) {
        return {
            type: ((_a = error.constructor) === null || _a === void 0 ? void 0 : _a.name) || error.name || 'Error',
            message: error.message,
            stack: typeof error.stack === 'string' ? error.stack : undefined,
        };
    }
    return { type: error === null ? 'null' : typeof error, message: String(error) };
}
