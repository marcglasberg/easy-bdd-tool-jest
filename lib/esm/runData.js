// The data each test file records for the `JestReporter`, which runs in Jest's main process.
//
// When the `JestReporter` is used, it creates a temporary directory for the run, and
// puts its path in the RUN_DIR_ENV environment variable before Jest starts the test
// files. Each test file then writes one NDJSON file into that directory, with one
// `RunEvent` per line.
/** The environment variable with the directory where the test files record their BDDs. */
export const RUN_DIR_ENV = 'EASY_BDD_TOOL_JEST_RUN_DIR';
/** The version of the format of the recorded data. */
export const RUN_DATA_VERSION = 1;
/**
 * Whether the [error] looks like an `Error`. Note `instanceof Error` is not used, since errors
 * may come from another JavaScript realm (for example, Detox creates its errors outside of the
 * Jest test environment), and then they are not instances of this realm's `Error`.
 */
export function isErrorLike(error) {
    return typeof error === 'object' && error !== null && typeof error.message === 'string';
}
/** Converts anything thrown into an [ErrorData]. */
export function errorData(error) {
    if (isErrorLike(error)) {
        const className = error.constructor?.name;
        const name = typeof error.name === 'string' ? error.name : undefined;
        return {
            type: (className && className !== 'Object' ? className : name) || 'Error',
            message: error.message,
            stack: typeof error.stack === 'string' ? error.stack : undefined,
        };
    }
    return { type: error === null ? 'null' : typeof error, message: String(error) };
}
