"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BddRunner = void 0;
const BddError_1 = require("./BddError");
const BddExecution_1 = require("./BddExecution");
const BddReporter_1 = require("./BddReporter");
const Config_1 = require("./Config");
const Context_1 = require("./Context");
const jestFramework_1 = require("./jestFramework");
const Keywords_1 = require("./Keywords");
const MultipleTableValues_1 = require("./MultipleTableValues");
const RunRecorder_1 = require("./RunRecorder");
const TableValues_1 = require("./TableValues");
/**
 * Runs the BDDs, by declaring one test for each BDD (or one test for each example
 * row of the BDD) in the test framework. You don't need to use this class directly:
 * just end the BDD with `.run()`.
 */
class BddRunner {
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
        BddReporter_1.BddReporter._reporters.forEach(reporter => reporter._addBdd(bdd));
        const testCount = ++BddReporter_1.BddReporter.runInfo.testCount;
        // One test for each example row, or a single test if there are no examples.
        const numberOfExamples = bdd.numberOfExamples();
        const exampleNumbers = numberOfExamples === 0 ? [null] : Array.from({ length: numberOfExamples }, (_, i) => i);
        const testNames = exampleNumbers.map(exampleNumber => `${BddRunner.testCountStr(testCount, exampleNumber)} ${bdd.description()}`);
        RunRecorder_1.RunRecorder.declare(bdd, testNames);
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
        reporter === null || reporter === void 0 ? void 0 : reporter._addBdd(bdd);
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
            throw new BddError_1.BddError('A Background runs before each scenario of its feature, and is not run by itself. ' +
                'Remove the .run() from the Background steps.');
    }
    static _runTheTest(bdd, exampleNumber, testIndex, testName) {
        const runInfo = BddReporter_1.BddReporter.runInfo;
        const testId = ++runInfo.totalTestCount;
        const testCountStr = BddRunner.testCountStr(runInfo.testCount, exampleNumber);
        const bddStr = bdd.toString(BddRunner.config, true);
        let currentExecution = 0;
        BddRunner.framework.test({
            description: testName,
            timeout: bdd._timeout,
            skip: bdd._skip,
            only: bdd._only,
            body: () => __awaiter(this, void 0, void 0, function* () {
                currentExecution++;
                runInfo._setResult(testId, 'running');
                process.stdout.write((currentExecution === 1
                    ? `\n${BddRunner._header(testCountStr)}${BddRunner.blue}${bddStr}${BddRunner.boldOff}`
                    : `\n${BddRunner.red}Retry ${currentExecution}.\n${BddRunner.boldOff}`) + '\n');
                const attempt = currentExecution;
                const ctx = BddRunner._context(bdd, exampleNumber);
                const execution = new BddExecution_1.BddExecution(exampleNumber, attempt);
                bdd._executions.push(execution);
                RunRecorder_1.RunRecorder.start(bdd, testIndex, attempt, execution.startedAt);
                try {
                    const codes = BddRunner._codeToRun(bdd);
                    for (let i = 0; i < codes.length; i++) {
                        try {
                            yield execution._run(codes[i].codeTerm, codes[i].codeRun, ctx);
                        }
                        finally {
                            const code = execution._lastCode;
                            if (!code.passed)
                                BddRunner.removeInternalFrames(code.error);
                            RunRecorder_1.RunRecorder.code(bdd, testIndex, attempt, i, code);
                        }
                    }
                }
                catch (error) {
                    execution._fail(error);
                    bdd.passed.push(false);
                    runInfo._setResult(testId, 'failed');
                    RunRecorder_1.RunRecorder.end(bdd, testIndex, attempt, execution.duration, true, error);
                    process.stdout.write(BddRunner._fail(testCountStr));
                    throw BddRunner.removeInternalFrames(error);
                }
                execution._finish();
                RunRecorder_1.RunRecorder.end(bdd, testIndex, attempt, execution.duration, false);
                bdd.passed.push(true);
                runInfo._setResult(testId, 'passed');
                process.stdout.write(BddRunner._footer(testCountStr));
            }),
        });
    }
    static _testRunTheTest(bdd, exampleNumber) {
        if (bdd._skip)
            return;
        const ctx = BddRunner._context(bdd, exampleNumber);
        const execution = new BddExecution_1.BddExecution(exampleNumber, 1);
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
        var _a, _b, _c;
        const backgroundTables = (_c = (_b = (_a = bdd.feature) === null || _a === void 0 ? void 0 : _a.backgroundBdd) === null || _b === void 0 ? void 0 : _b.tables()) !== null && _c !== void 0 ? _c : [];
        return new Context_1.Context(TableValues_1.TableValues.from(bdd.exampleRow(exampleNumber)), MultipleTableValues_1.MultipleTableValues.from([...backgroundTables, ...bdd.tables()]));
    }
    /**
     * The code blocks of the BDD, in the order they run: the Background code first,
     * then the code of the steps, then the callback given to `.run()`.
     * @internal
     */
    static _codeToRun(bdd) {
        var _a;
        const result = [];
        const background = (_a = bdd.feature) === null || _a === void 0 ? void 0 : _a.backgroundBdd;
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
        if (_ownDirectory === undefined || !(error instanceof Error) || typeof error.stack !== 'string')
            return error;
        const lines = error.stack.split('\n');
        const filtered = lines.filter(line => !(/^\s+at /.test(line) && line.includes(_ownDirectory)));
        // Keep the stack if it would have no frames left.
        if (filtered.length < lines.length && filtered.some(line => /^\s+at /.test(line))) {
            try {
                error.stack = filtered.join('\n');
            }
            catch (_a) {
                // The stack can't be changed. Keep it.
            }
        }
        return error;
    }
}
exports.BddRunner = BddRunner;
/**
 * The test framework that runs the BDDs. The default is Jest.
 * See [TestFramework].
 */
BddRunner.framework = jestFramework_1.jestFramework;
BddRunner.red = '\x1B[38;5;9m';
BddRunner.blue = '\x1B[38;5;45m';
BddRunner.yellow = '\x1B[38;5;226m';
BddRunner.grey = '\x1B[38;5;246m';
BddRunner.bold = '\u001b[1m';
BddRunner.italic = '\u001b[3m';
BddRunner.boldItalic = BddRunner.bold + BddRunner.italic;
BddRunner.boldOff = '\u001b[22m';
BddRunner.italicOff = '\u001b[23m';
BddRunner.boldItalicOff = BddRunner.boldOff + BddRunner.italicOff;
BddRunner.reset = '\u001b[0m';
/** The configuration of the (colored) BDD description printed to the console before each test. */
BddRunner.config = new Config_1.Config({
    keywords: new Keywords_1.Keywords({
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
    keywordPrefix: Keywords_1.Keywords.only({
        scenario: '\n',
        scenarioOutline: '\n',
        given: '\n',
        when: '\n',
        then: '\n',
        comment: BddRunner.grey,
        examples: '\n',
    }),
    suffix: Keywords_1.Keywords.only({
        comment: BddRunner.blue,
    }),
});
/**
 * The directory of this package's own code (`src/`, or `lib/cjs/` or `lib/esm/`),
 * including the final separator, found from the stack trace of this module.
 */
const _ownDirectory = (() => {
    var _a;
    const frame = (_a = new Error().stack) === null || _a === void 0 ? void 0 : _a.split('\n').find(line => /^\s+at /.test(line));
    const match = frame ? /(?:\(|at )((?:file:\/\/)?[^()]+?):\d+:\d+\)?\s*$/.exec(frame) : null;
    if (!match)
        return undefined;
    const file = match[1];
    const separator = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
    return separator > 0 ? file.substring(0, separator + 1) : undefined;
})();
