import { BddError } from './BddError';
import { BddExecution } from './BddExecution';
import { BddReporter } from './BddReporter';
import { Config } from './Config';
import { Context } from './Context';
import { jestFramework } from './jestFramework';
import { Keywords } from './Keywords';
import { MultipleTableValues } from './MultipleTableValues';
import { RunRecorder } from './RunRecorder';
import { TableValues } from './TableValues';
/**
 * Runs the BDDs, by declaring one test for each BDD (or one test for each example
 * row of the BDD) in the test framework. You don't need to use this class directly:
 * just end the BDD with `.run()`.
 */
export class BddRunner {
    /**
     * The test framework that runs the BDDs. The default is Jest.
     * See [TestFramework].
     */
    static framework = jestFramework;
    static red = '\x1B[38;5;9m';
    static blue = '\x1B[38;5;45m';
    static yellow = '\x1B[38;5;226m';
    static grey = '\x1B[38;5;246m';
    static bold = '\u001b[1m';
    static italic = '\u001b[3m';
    static boldItalic = BddRunner.bold + BddRunner.italic;
    static boldOff = '\u001b[22m';
    static italicOff = '\u001b[23m';
    static boldItalicOff = BddRunner.boldOff + BddRunner.italicOff;
    static reset = '\u001b[0m';
    /** The configuration of the (colored) BDD description printed to the console before each test. */
    static config = new Config({
        keywords: new Keywords({
            feature: BddRunner._boldItalic('Feature:'),
            background: BddRunner._boldItalic('Background:'),
            scenario: BddRunner._boldItalic('Scenario:'),
            scenarioOutline: BddRunner._boldItalic('Scenario Outline:'),
            given: BddRunner._boldItalic('Given'),
            when: BddRunner._boldItalic('When'),
            then: BddRunner._boldItalic('Then'),
            and: BddRunner._boldItalic('And'),
            but: BddRunner._boldItalic('But'),
            comment: BddRunner._boldItalic('#'),
            examples: BddRunner._boldItalic('Examples:'),
        }),
        keywordPrefix: Keywords.only({
            scenario: '\n',
            scenarioOutline: '\n',
            given: '\n',
            when: '\n',
            then: '\n',
            comment: BddRunner.grey,
            examples: '\n',
        }),
        suffix: Keywords.only({
            comment: BddRunner.blue,
        }),
    });
    static _boldItalic(text) {
        return `${BddRunner.boldItalic}${text}${BddRunner.boldItalicOff}`;
    }
    /**
     * Declares the test(s) of the [bdd]. The [code] is the callback given to `.run()`.
     * It belongs to no step, and runs after the code of the steps (added with `.code()`).
     */
    static run(bdd, code) {
        BddRunner._checkCanRun(bdd);
        if (code)
            bdd.addCode(code);
        BddReporter._reporters.forEach(reporter => reporter._addBdd(bdd));
        const testCount = ++BddReporter.runInfo.testCount;
        // One test for each example row, or a single test if there are no examples.
        const numberOfExamples = bdd.numberOfExamples();
        const exampleNumbers = numberOfExamples === 0 ? [null] : Array.from({ length: numberOfExamples }, (_, i) => i);
        const testNames = exampleNumbers.map(exampleNumber => `${BddRunner.testCountStr(testCount, exampleNumber)} ${bdd.description()}`);
        RunRecorder.declare(bdd, testNames);
        exampleNumbers.forEach((exampleNumber, testIndex) => BddRunner._runTheTest(bdd, exampleNumber, testIndex, testNames[testIndex]));
    }
    /**
     * Runs the [bdd] right away, without declaring tests, and only for synchronous code.
     * The results are in `bdd.passed` and `bdd.executions`. Visible for testing.
     */
    static testRun(bdd, code, reporter) {
        BddRunner._checkCanRun(bdd);
        if (code)
            bdd.addCode(code);
        reporter?._addBdd(bdd);
        const numberOfExamples = bdd.numberOfExamples();
        if (numberOfExamples === 0)
            BddRunner._testRunTheTest(bdd, null);
        else
            for (let i = 0; i < numberOfExamples; i++)
                BddRunner._testRunTheTest(bdd, i);
    }
    /** Converts a number into subscript digits. For example: `12` becomes `₁₂`. */
    static subscript(index) {
        const digits = '₀₁₂₃₄₅₆₇₈₉';
        return Array.from(index.toString())
            .map(char => digits[Number(char)])
            .join('');
    }
    /** For example: `4` (a BDD without examples) or `4₁` (the first example of BDD 4). */
    static testCountStr(testCount, exampleNumber) {
        return `${testCount}${exampleNumber === null ? '' : BddRunner.subscript(exampleNumber + 1)}`;
    }
    static _checkCanRun(bdd) {
        if (bdd.isBackground)
            throw new BddError('A Background runs before each scenario of its feature, and is not run by itself. ' +
                'Remove the .run() from the Background steps.');
    }
    static _runTheTest(bdd, exampleNumber, testIndex, testName) {
        const runInfo = BddReporter.runInfo;
        const testId = ++runInfo.totalTestCount;
        const testCountStr = BddRunner.testCountStr(runInfo.testCount, exampleNumber);
        const bddStr = bdd.toString(BddRunner.config, true);
        let currentExecution = 0;
        BddRunner.framework.test({
            description: testName,
            timeout: bdd._timeout,
            skip: bdd._skip,
            only: bdd._only,
            body: async () => {
                currentExecution++;
                runInfo._setResult(testId, 'running');
                process.stdout.write((currentExecution === 1
                    ? `\n${BddRunner._header(testCountStr)}${BddRunner.blue}${bddStr}${BddRunner.boldOff}`
                    : `\n${BddRunner.red}Retry ${currentExecution}.\n${BddRunner.boldOff}`) + '\n');
                const attempt = currentExecution;
                const ctx = BddRunner._context(bdd, exampleNumber);
                const execution = new BddExecution(exampleNumber, attempt);
                bdd._executions.push(execution);
                RunRecorder.start(bdd, testIndex, attempt, execution.startedAt);
                try {
                    const codes = BddRunner._codeToRun(bdd);
                    for (let i = 0; i < codes.length; i++) {
                        try {
                            await execution._run(codes[i].codeTerm, codes[i].codeRun, ctx);
                        }
                        finally {
                            const code = execution._lastCode;
                            if (!code.passed)
                                BddRunner.removeInternalFrames(code.error);
                            RunRecorder.code(bdd, testIndex, attempt, i, code);
                        }
                    }
                }
                catch (error) {
                    execution._fail(error);
                    bdd.passed.push(false);
                    runInfo._setResult(testId, 'failed');
                    RunRecorder.end(bdd, testIndex, attempt, execution.duration, true, error);
                    process.stdout.write(BddRunner._fail(testCountStr));
                    throw BddRunner.removeInternalFrames(error);
                }
                execution._finish();
                RunRecorder.end(bdd, testIndex, attempt, execution.duration, false);
                bdd.passed.push(true);
                runInfo._setResult(testId, 'passed');
                process.stdout.write(BddRunner._footer(testCountStr));
            },
        });
    }
    static _testRunTheTest(bdd, exampleNumber) {
        if (bdd._skip)
            return;
        const ctx = BddRunner._context(bdd, exampleNumber);
        const execution = new BddExecution(exampleNumber, 1);
        bdd._executions.push(execution);
        try {
            for (const { codeTerm, codeRun } of BddRunner._codeToRun(bdd)) {
                const result = execution._run(codeTerm, codeRun, ctx);
                // Only synchronous code is supported here. Avoid unhandled rejections.
                if (result instanceof Promise)
                    result.catch(() => undefined);
            }
        }
        catch (error) {
            execution._fail(error);
            bdd.passed.push(false);
            return;
        }
        execution._finish();
        bdd.passed.push(true);
    }
    /** The tables of the Background, and of the BDD itself. */
    static _context(bdd, exampleNumber) {
        const backgroundTables = bdd.feature?.backgroundBdd?.tables() ?? [];
        return new Context(TableValues.from(bdd.exampleRow(exampleNumber)), MultipleTableValues.from([...backgroundTables, ...bdd.tables()]));
    }
    /**
     * The code blocks of the BDD, in the order they run: the Background code first,
     * then the code of the steps, then the callback given to `.run()`.
     * @internal
     */
    static _codeToRun(bdd) {
        const result = [];
        const background = bdd.feature?.backgroundBdd;
        const codeTerms = [...(background ? Array.from(background.codeTerms) : []), ...Array.from(bdd.codeTerms)];
        for (const codeTerm of codeTerms) {
            if (codeTerm.codeRun)
                result.push({ codeTerm, codeRun: codeTerm.codeRun });
        }
        for (const codeRun of bdd.codeRuns) {
            if (codeRun)
                result.push({ codeTerm: null, codeRun });
        }
        return result;
    }
    static _header(testNumberStr) {
        return (`${BddRunner.yellow}${BddRunner.italic}TEST ${testNumberStr} ${BddRunner.italicOff}` +
            `══════════════════════════════════════════════════${BddRunner.reset}\n\n`);
    }
    static _footer(testNumberStr) {
        return `${BddRunner.grey}\n✔ ${BddRunner.italic}TEST ${testNumberStr} PASSED!${BddRunner.reset}\n\n`;
    }
    static _fail(testNumberStr) {
        return `${BddRunner.grey}\n⚠ ${BddRunner.italic}TEST ${testNumberStr} FAILED!${BddRunner.reset}\n\n`;
    }
    /**
     * Removes the stack frames of this package from the [error]'s stack trace,
     * so that the stack trace shows only your own code (and the test framework's).
     * Returns the same error.
     */
    static removeInternalFrames(error) {
        // Not `instanceof Error`, since the error may come from another JavaScript realm (like Detox's errors).
        if (_ownDirectory === undefined || typeof error !== 'object' || error === null)
            return error;
        const stack = error.stack;
        if (typeof stack !== 'string')
            return error;
        const lines = stack.split('\n');
        const filtered = lines.filter(line => !(/^\s+at /.test(line) && line.includes(_ownDirectory)));
        // Keep the stack if it would have no frames left.
        if (filtered.length < lines.length && filtered.some(line => /^\s+at /.test(line))) {
            try {
                error.stack = filtered.join('\n');
            }
            catch {
                // The stack can't be changed. Keep it.
            }
        }
        return error;
    }
}
/**
 * The directory of this package's own code (`src/`, or `lib/cjs/` or `lib/esm/`),
 * including the final separator, found from the stack trace of this module.
 */
const _ownDirectory = (() => {
    const frame = new Error().stack?.split('\n').find(line => /^\s+at /.test(line));
    const match = frame ? /(?:\(|at )((?:file:\/\/)?[^()]+?):\d+:\d+\)?\s*$/.exec(frame) : null;
    if (!match)
        return undefined;
    const file = match[1];
    const separator = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
    return separator > 0 ? file.substring(0, separator + 1) : undefined;
})();
