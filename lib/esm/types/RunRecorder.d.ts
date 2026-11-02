import type { BDD } from './Bdd';
import type { BddCodeExecution } from './BddExecution';
import type { StepData } from './runData';
/**
 * Records the BDDs of the current test file, and what happened when they ran, for the
 * `JestReporter` (see `runData.ts`). It records nothing when the `JestReporter` is not used.
 *
 * Jest loads this module separately for each test file, so each test file has its own
 * recorder, and its own file.
 */
export declare class RunRecorder {
    /** The file, `null` if not recording, or `undefined` if not known yet. */
    private static _file;
    private static readonly _ids;
    private static readonly _tests;
    private static _pending;
    private static readonly _features;
    private static _flushScheduled;
    private static _emptyFeature?;
    /** Whether the BDDs are being recorded. */
    static get isRecording(): boolean;
    /** Records a BDD and the names of its Jest tests, right after it's declared. */
    static declare(bdd: BDD, tests: string[]): void;
    static start(bdd: BDD, test: number, attempt: number, startedAt: Date): void;
    static code(bdd: BDD, test: number, attempt: number, code: number, execution: BddCodeExecution): void;
    static end(bdd: BDD, test: number, attempt: number, duration: number, failed: boolean, error?: unknown): void;
    /**
     * The Gherkin steps of the [bdd], including the ones of its Background, with the indexes
     * of the code blocks of each step. Then, if the BDD has `.run()` callbacks, a hook that
     * runs them. The indexes are positions in `BddRunner._codeToRun(bdd)`.
     */
    static stepsOf(bdd: BDD): StepData[];
    private static _idOf;
    private static _flush;
    private static _filePath;
    private static _write;
    private static _writeLine;
}
//# sourceMappingURL=RunRecorder.d.ts.map