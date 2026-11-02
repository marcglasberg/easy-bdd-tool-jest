import { appendFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { CodeTerm, Term } from './Bdd';
import { BddRunner } from './BddRunner';
import { Feature } from './Feature';
import { scenarioGherkin } from './gherkin';
import { errorData, RUN_DATA_VERSION, RUN_DIR_ENV } from './runData';
/**
 * Records the BDDs of the current test file, and what happened when they ran, for the
 * `JestReporter` (see `runData.ts`). It records nothing when the `JestReporter` is not used.
 *
 * Jest loads this module separately for each test file, so each test file has its own
 * recorder, and its own file.
 */
export class RunRecorder {
    /** The file, `null` if not recording, or `undefined` if not known yet. */
    static _file;
    static _ids = new Map();
    static _tests = new Map();
    static _pending = [];
    static _features = new Map();
    static _flushScheduled = false;
    static _emptyFeature;
    /** Whether the BDDs are being recorded. */
    static get isRecording() {
        return RunRecorder._filePath() !== null;
    }
    /** Records a BDD and the names of its Jest tests, right after it's declared. */
    static declare(bdd, tests) {
        if (RunRecorder._filePath() === null)
            return;
        RunRecorder._ids.set(bdd, RunRecorder._ids.size);
        RunRecorder._tests.set(bdd, tests);
        RunRecorder._pending.push(bdd);
        // The BDDs are written after the test file is loaded, when the features are complete.
        if (!RunRecorder._flushScheduled) {
            RunRecorder._flushScheduled = true;
            Promise.resolve().then(() => RunRecorder._flush());
        }
    }
    static start(bdd, test, attempt, startedAt) {
        const id = RunRecorder._idOf(bdd);
        if (id === undefined)
            return;
        RunRecorder._write({ type: 'start', bdd: id, test, attempt, startedAt: startedAt.getTime() });
    }
    static code(bdd, test, attempt, code, execution) {
        const id = RunRecorder._idOf(bdd);
        if (id === undefined)
            return;
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
    static end(bdd, test, attempt, duration, failed, error) {
        const id = RunRecorder._idOf(bdd);
        if (id === undefined)
            return;
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
    static stepsOf(bdd) {
        const codes = BddRunner._codeToRun(bdd);
        const indexOf = new Map();
        const callbacks = [];
        codes.forEach((code, i) => {
            if (code.codeTerm === null)
                callbacks.push(i);
            else
                indexOf.set(code.codeTerm, i);
        });
        const steps = [];
        // Code that comes before any step (only possible after a note) belongs to the next step.
        const pending = [];
        const background = bdd.feature?.backgroundBdd;
        for (const term of [...(background ? background.terms : []), ...bdd.terms]) {
            if (term instanceof CodeTerm) {
                const index = indexOf.get(term);
                if (index === undefined)
                    continue; // A `.code()` without code.
                if (steps.length === 0)
                    pending.push(index);
                else
                    steps[steps.length - 1].codes.push(index);
            }
            else if (term instanceof Term && term.isStep) {
                steps.push({ hook: false, codes: [...pending] });
                pending.length = 0;
            }
        }
        if (callbacks.length > 0 || pending.length > 0)
            steps.push({ hook: true, codes: [...pending, ...callbacks] });
        return steps;
    }
    static _idOf(bdd) {
        if (RunRecorder._filePath() === null)
            return undefined;
        // The BDD must be written before what happened when it ran.
        if (RunRecorder._pending.length > 0)
            RunRecorder._flush();
        return RunRecorder._ids.get(bdd);
    }
    static _flush() {
        RunRecorder._flushScheduled = false;
        const pending = RunRecorder._pending;
        RunRecorder._pending = [];
        for (const bdd of pending) {
            const feature = bdd.feature ?? (RunRecorder._emptyFeature ??= new Feature(''));
            const featureEvent = {
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
                bdd: RunRecorder._ids.get(bdd),
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
    static _filePath() {
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
    static _write(event) {
        RunRecorder._writeLine(JSON.stringify(event));
    }
    static _writeLine(line) {
        const file = RunRecorder._file;
        if (!file)
            return;
        try {
            appendFileSync(file, line + '\n', 'utf-8');
        }
        catch (error) {
            // Never fail the tests because of this. The JestReporter will see the data is incomplete.
            RunRecorder._file = null;
            process.stderr.write(`easy-bdd-tool-jest: Could not record the BDDs for the JestReporter: ${error}\n`);
        }
    }
}
