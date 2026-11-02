/**
 * One run of a BDD, recorded while it runs, so that reporters can tell what
 * happened in each code block: whether it passed, how long it took, and which
 * error it threw.
 *
 * A BDD with examples runs once per example row, and a BDD with retries
 * (`jest.retryTimes()`) may run more than once for the same row. Each of those
 * runs is a separate [BddExecution]. A BDD that was skipped, or that never ran,
 * has none.
 *
 * These are observations of the BDD code, not the final Jest result. Errors in
 * `beforeEach`/`afterEach` are not recorded, and a test that timed out never
 * finishes here.
 */
export class BddExecution {
    /** The index of the example row this run used, or `null` if the BDD has no examples. */
    exampleIndex;
    /** Which attempt this is for the same example row: `1` for the first run, `2` for the first retry, and so on. */
    attempt;
    /** When this run started. */
    startedAt;
    _codeExecutions = [];
    _start;
    _duration;
    _error;
    _failed = false;
    /** @internal */
    constructor(exampleIndex, attempt) {
        this.exampleIndex = exampleIndex;
        this.attempt = attempt;
        this.startedAt = new Date();
        this._start = performance.now();
    }
    /**
     * The code blocks that ran, in the order they ran. The Background code comes
     * first, then the code of the steps, then the callback given to `.run()`.
     * Code blocks after a failing one didn't run, so they are not in this list.
     */
    get codeExecutions() {
        return [...this._codeExecutions];
    }
    /** How long the run took, in milliseconds, or `undefined` while it has not finished. */
    get duration() {
        return this._duration;
    }
    /** Whether the run finished, either passing or failing. */
    get isFinished() {
        return this._duration !== undefined;
    }
    /** Whether the run finished without errors. */
    get passed() {
        return this.isFinished && !this._failed;
    }
    /** The error that failed the run, if any. */
    get error() {
        return this._error;
    }
    /** The result of the given [codeTerm] (added with `.code()`), or `undefined` if it didn't run. */
    resultOf(codeTerm) {
        return this._codeExecutions.find(code => code.codeTerm === codeTerm);
    }
    /** The code block that started last, if any. @internal */
    get _lastCode() {
        return this._codeExecutions[this._codeExecutions.length - 1];
    }
    /** The results of the callbacks given to `.run()`, which belong to no step. */
    get callbackResults() {
        return this._codeExecutions.filter(code => code.codeTerm === null);
    }
    /**
     * Runs the [codeRun] and records its result. Errors are recorded and rethrown.
     * Synchronous code stays synchronous: if [codeRun] throws synchronously, this
     * throws synchronously too.
     * @internal
     */
    _run(codeTerm, codeRun, ctx) {
        const code = new BddCodeExecution(codeTerm);
        this._codeExecutions.push(code);
        let result;
        try {
            result = codeRun(ctx);
        }
        catch (error) {
            code._fail(error);
            throw error;
        }
        if (result instanceof Promise) {
            return result.then(() => code._finish(), (error) => {
                code._fail(error);
                throw error;
            });
        }
        code._finish();
    }
    /** @internal */
    _finish() {
        this._duration = performance.now() - this._start;
    }
    /** @internal */
    _fail(error) {
        this._finish();
        this._failed = true;
        this._error = error;
    }
    toString() {
        return (`BddExecution{exampleIndex: ${this.exampleIndex}, attempt: ${this.attempt}, ` +
            `passed: ${this.passed}, duration: ${this.duration}}`);
    }
}
/** The result of running one code block of a BDD. See [BddExecution]. */
export class BddCodeExecution {
    /** The step code that ran, added with `.code()`. It's `null` for the callback given to `.run()`. */
    codeTerm;
    /** When the code block started. */
    startedAt;
    _start;
    _duration;
    _error;
    _failed = false;
    /** @internal */
    constructor(codeTerm) {
        this.codeTerm = codeTerm;
        this.startedAt = new Date();
        this._start = performance.now();
    }
    /** How long the code block took, in milliseconds, or `undefined` while it has not finished. */
    get duration() {
        return this._duration;
    }
    /** Whether the code block finished, either passing or failing. */
    get isFinished() {
        return this._duration !== undefined;
    }
    /** Whether the code block finished without errors. */
    get passed() {
        return this.isFinished && !this._failed;
    }
    /** The error the code block threw, if any. */
    get error() {
        return this._error;
    }
    /** @internal */
    _finish() {
        this._duration = performance.now() - this._start;
    }
    /** @internal */
    _fail(error) {
        this._finish();
        this._failed = true;
        this._error = error;
    }
    toString() {
        return `BddCodeExecution{passed: ${this.passed}, duration: ${this.duration}}`;
    }
}
