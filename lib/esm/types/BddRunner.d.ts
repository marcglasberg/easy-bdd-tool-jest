import type { BDD, CodeRun, CodeTerm } from './Bdd';
import { BddReporter } from './BddReporter';
import { Config } from './Config';
import type { TestFramework } from './TestFramework';
type _CodeToRun = {
    codeTerm: CodeTerm | null;
    codeRun: NonNullable<CodeRun>;
};
/**
 * Runs the BDDs, by declaring one test for each BDD (or one test for each example
 * row of the BDD) in the test framework. You don't need to use this class directly:
 * just end the BDD with `.run()`.
 */
export declare class BddRunner {
    /**
     * The test framework that runs the BDDs. The default is Jest.
     * See [TestFramework].
     */
    static framework: TestFramework;
    static readonly red = "\u001B[38;5;9m";
    static readonly blue = "\u001B[38;5;45m";
    static readonly yellow = "\u001B[38;5;226m";
    static readonly grey = "\u001B[38;5;246m";
    static readonly bold = "\u001B[1m";
    static readonly italic = "\u001B[3m";
    static readonly boldItalic: string;
    static readonly boldOff = "\u001B[22m";
    static readonly italicOff = "\u001B[23m";
    static readonly boldItalicOff: string;
    static readonly reset = "\u001B[0m";
    /** The configuration of the (colored) BDD description printed to the console before each test. */
    static readonly config: Config;
    private static _boldItalic;
    /**
     * Declares the test(s) of the [bdd]. The [code] is the callback given to `.run()`.
     * It belongs to no step, and runs after the code of the steps (added with `.code()`).
     */
    static run(bdd: BDD, code: CodeRun): void;
    /**
     * Runs the [bdd] right away, without declaring tests, and only for synchronous code.
     * The results are in `bdd.passed` and `bdd.executions`. Visible for testing.
     */
    static testRun(bdd: BDD, code: CodeRun, reporter?: BddReporter): void;
    /** Converts a number into subscript digits. For example: `12` becomes `₁₂`. */
    static subscript(index: number): string;
    /** For example: `4` (a BDD without examples) or `4₁` (the first example of BDD 4). */
    static testCountStr(testCount: number, exampleNumber: number | null): string;
    private static _checkCanRun;
    private static _runTheTest;
    private static _testRunTheTest;
    /** The tables of the Background, and of the BDD itself. */
    private static _context;
    /**
     * The code blocks of the BDD, in the order they run: the Background code first,
     * then the code of the steps, then the callback given to `.run()`.
     * @internal
     */
    static _codeToRun(bdd: BDD): _CodeToRun[];
    private static _header;
    private static _footer;
    private static _fail;
    /**
     * Removes the stack frames of this package from the [error]'s stack trace,
     * so that the stack trace shows only your own code (and the test framework's).
     * Returns the same error.
     */
    static removeInternalFrames<T>(error: T): T;
}
export {};
//# sourceMappingURL=BddRunner.d.ts.map