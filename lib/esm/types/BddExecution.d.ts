import type { CodeRun, CodeTerm } from './Bdd';
import type { Context } from './Context';
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
export declare class BddExecution {
    /** The index of the example row this run used, or `null` if the BDD has no examples. */
    readonly exampleIndex: number | null;
    /** Which attempt this is for the same example row: `1` for the first run, `2` for the first retry, and so on. */
    readonly attempt: number;
    /** When this run started. */
    readonly startedAt: Date;
    private readonly _codeExecutions;
    private readonly _start;
    private _duration?;
    private _error?;
    private _failed;
    /** @internal */
    constructor(exampleIndex: number | null, attempt: number);
    /**
     * The code blocks that ran, in the order they ran. The Background code comes
     * first, then the code of the steps, then the callback given to `.run()`.
     * Code blocks after a failing one didn't run, so they are not in this list.
     */
    get codeExecutions(): BddCodeExecution[];
    /** How long the run took, in milliseconds, or `undefined` while it has not finished. */
    get duration(): number | undefined;
    /** Whether the run finished, either passing or failing. */
    get isFinished(): boolean;
    /** Whether the run finished without errors. */
    get passed(): boolean;
    /** The error that failed the run, if any. */
    get error(): unknown;
    /** The result of the given [codeTerm] (added with `.code()`), or `undefined` if it didn't run. */
    resultOf(codeTerm: CodeTerm): BddCodeExecution | undefined;
    /** The code block that started last, if any. @internal */
    get _lastCode(): BddCodeExecution | undefined;
    /** The results of the callbacks given to `.run()`, which belong to no step. */
    get callbackResults(): BddCodeExecution[];
    /**
     * Runs the [codeRun] and records its result. Errors are recorded and rethrown.
     * Synchronous code stays synchronous: if [codeRun] throws synchronously, this
     * throws synchronously too.
     * @internal
     */
    _run(codeTerm: CodeTerm | null, codeRun: NonNullable<CodeRun>, ctx: Context): void | Promise<void>;
    /** @internal */
    _finish(): void;
    /** @internal */
    _fail(error: unknown): void;
    toString(): string;
}
/** The result of running one code block of a BDD. See [BddExecution]. */
export declare class BddCodeExecution {
    /** The step code that ran, added with `.code()`. It's `null` for the callback given to `.run()`. */
    readonly codeTerm: CodeTerm | null;
    /** When the code block started. */
    readonly startedAt: Date;
    private readonly _start;
    private _duration?;
    private _error?;
    private _failed;
    /** @internal */
    constructor(codeTerm: CodeTerm | null);
    /** How long the code block took, in milliseconds, or `undefined` while it has not finished. */
    get duration(): number | undefined;
    /** Whether the code block finished, either passing or failing. */
    get isFinished(): boolean;
    /** Whether the code block finished without errors. */
    get passed(): boolean;
    /** The error the code block threw, if any. */
    get error(): unknown;
    /** @internal */
    _finish(): void;
    /** @internal */
    _fail(error: unknown): void;
    toString(): string;
}
//# sourceMappingURL=BddExecution.d.ts.map