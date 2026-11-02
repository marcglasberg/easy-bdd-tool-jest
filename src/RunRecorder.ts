import { appendFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { CodeTerm, Term } from './Bdd';
import type { BDD } from './Bdd';
import type { BddCodeExecution } from './BddExecution';
import { BddRunner } from './BddRunner';
import { Feature } from './Feature';
import { scenarioGherkin } from './gherkin';
import { errorData, RUN_DATA_VERSION, RUN_DIR_ENV } from './runData';
import type { RunEvent, StepData } from './runData';

/**
 * Records the BDDs of the current test file, and what happened when they ran, for the
 * `JestReporter` (see `runData.ts`). It records nothing when the `JestReporter` is not used.
 *
 * Jest loads this module separately for each test file, so each test file has its own
 * recorder, and its own file.
 */
export class RunRecorder {
  /** The file, `null` if not recording, or `undefined` if not known yet. */
  private static _file: string | null | undefined;
  private static readonly _ids = new Map<BDD, number>();
  private static readonly _tests = new Map<BDD, string[]>();
  private static _pending: BDD[] = [];
  private static readonly _features = new Map<string, string>();
  private static _flushScheduled = false;
  private static _emptyFeature?: Feature;

  /** Whether the BDDs are being recorded. */
  static get isRecording(): boolean {
    return RunRecorder._filePath() !== null;
  }

  /** Records a BDD and the names of its Jest tests, right after it's declared. */
  static declare(bdd: BDD, tests: string[]): void {
    if (RunRecorder._filePath() === null) return;
    RunRecorder._ids.set(bdd, RunRecorder._ids.size);
    RunRecorder._tests.set(bdd, tests);
    RunRecorder._pending.push(bdd);

    // The BDDs are written after the test file is loaded, when the features are complete.
    if (!RunRecorder._flushScheduled) {
      RunRecorder._flushScheduled = true;
      Promise.resolve().then(() => RunRecorder._flush());
    }
  }

  static start(bdd: BDD, test: number, attempt: number, startedAt: Date): void {
    const id = RunRecorder._idOf(bdd);
    if (id === undefined) return;
    RunRecorder._write({ type: 'start', bdd: id, test, attempt, startedAt: startedAt.getTime() });
  }

  static code(bdd: BDD, test: number, attempt: number, code: number, execution: BddCodeExecution): void {
    const id = RunRecorder._idOf(bdd);
    if (id === undefined) return;
    RunRecorder._write({
      type: 'code',
      bdd: id,
      test,
      attempt,
      code,
      startedAt: execution.startedAt.getTime(),
      duration: execution.duration ?? 0,
      error: execution.passed ? undefined : errorData(execution.error),
    });
  }

  static end(bdd: BDD, test: number, attempt: number, duration: number, failed: boolean, error?: unknown): void {
    const id = RunRecorder._idOf(bdd);
    if (id === undefined) return;
    RunRecorder._write({
      type: 'end',
      bdd: id,
      test,
      attempt,
      duration,
      error: failed ? errorData(error) : undefined,
    });
  }

  /**
   * The Gherkin steps of the [bdd], including the ones of its Background, with the indexes
   * of the code blocks of each step. Then, if the BDD has `.run()` callbacks, a hook that
   * runs them. The indexes are positions in `BddRunner._codeToRun(bdd)`.
   */
  static stepsOf(bdd: BDD): StepData[] {
    const codes = BddRunner._codeToRun(bdd);
    const indexOf = new Map<CodeTerm, number>();
    const callbacks: number[] = [];
    codes.forEach((code, i) => {
      if (code.codeTerm === null) callbacks.push(i);
      else indexOf.set(code.codeTerm, i);
    });

    const steps: StepData[] = [];

    // Code that comes before any step (only possible after a note) belongs to the next step.
    const pending: number[] = [];

    const background = bdd.feature?.backgroundBdd;
    for (const term of [...(background ? background.terms : []), ...bdd.terms]) {
      if (term instanceof CodeTerm) {
        const index = indexOf.get(term);
        if (index === undefined) continue; // A `.code()` without code.
        if (steps.length === 0) pending.push(index);
        else steps[steps.length - 1].codes.push(index);
      } else if (term instanceof Term && term.isStep) {
        steps.push({ hook: false, codes: [...pending] });
        pending.length = 0;
      }
    }

    if (callbacks.length > 0 || pending.length > 0) steps.push({ hook: true, codes: [...pending, ...callbacks] });

    return steps;
  }

  private static _idOf(bdd: BDD): number | undefined {
    if (RunRecorder._filePath() === null) return undefined;
    // The BDD must be written before what happened when it ran.
    if (RunRecorder._pending.length > 0) RunRecorder._flush();
    return RunRecorder._ids.get(bdd);
  }

  private static _flush(): void {
    RunRecorder._flushScheduled = false;
    const pending = RunRecorder._pending;
    RunRecorder._pending = [];

    for (const bdd of pending) {
      const feature = bdd.feature ?? (RunRecorder._emptyFeature ??= new Feature(''));
      const featureEvent: RunEvent = {
        type: 'feature',
        title: feature.title,
        header: feature.toString(),
        background: feature.hasBackground ? feature.background.toString() : null,
      };
      const json = JSON.stringify(featureEvent);
      if (RunRecorder._features.get(feature.title) !== json) {
        RunRecorder._features.set(feature.title, json);
        RunRecorder._writeLine(json);
      }

      RunRecorder._write({
        type: 'bdd',
        bdd: RunRecorder._ids.get(bdd)!,
        feature: feature.title,
        scenario: scenarioGherkin(bdd.textTerms),
        steps: RunRecorder.stepsOf(bdd),
        codeCount: BddRunner._codeToRun(bdd).length,
        tests: RunRecorder._tests.get(bdd) ?? [],
        hasExamples: bdd.numberOfExamples() > 0,
        skip: bdd._skip,
        only: bdd._only,
      });
    }
  }

  private static _filePath(): string | null {
    if (RunRecorder._file === undefined) {
      const dir = process.env[RUN_DIR_ENV];
      RunRecorder._file = dir ? join(dir, `${process.pid}-${randomUUID()}.ndjson`) : null;
      if (RunRecorder._file !== null) {
        const testPath = BddRunner.framework.testPath?.() ?? '';
        RunRecorder._writeLine(JSON.stringify({ type: 'file', version: RUN_DATA_VERSION, testPath }));
      }
    }
    return RunRecorder._file;
  }

  private static _write(event: RunEvent): void {
    RunRecorder._writeLine(JSON.stringify(event));
  }

  private static _writeLine(line: string): void {
    const file = RunRecorder._file;
    if (!file) return;
    try {
      appendFileSync(file, line + '\n', 'utf-8');
    } catch (error) {
      // Never fail the tests because of this. The JestReporter will see the data is incomplete.
      RunRecorder._file = null;
      process.stderr.write(`easy-bdd-tool-jest: Could not record the BDDs for the JestReporter: ${error}\n`);
    }
  }
}
