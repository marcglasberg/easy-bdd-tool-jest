import { TableValues } from "./TableValues";
import { Feature } from "./Feature";
import { Row } from "./row";
import { Val } from "./val";
import { Context } from "./Context";
import { BddReporter } from "./BddReporter";
import { Config } from "./Config";
export declare class TableRows {
    private readonly _values;
    constructor(values: TableValues[]);
    /**
     * Example:
     * ctx.table('notifications').row(0).val('read') as bool;
     */
    row(index: number): TableValues;
    /**
     * Return the first row it finds with the given name/value pair. Example:
     * ctx.table('notifications').rowWhere(name: 'property', value: 'lastPrice').val('market') as Money;
     * If no name/value pair is found, an error is thrown.
     */
    rowWhere(name: string, value?: object): TableValues;
    /**
     * Example:
     * ctx.table('notifications').rows;
     */
    get rows(): TableValues[];
    toString(): string;
}
export declare function Bdd(feature?: Feature): BDD;
declare abstract class _BaseTerm {
    bdd: BDD;
    protected constructor(bdd: BDD);
}
declare enum _Variation {
    term = 0,
    and = 1,
    but = 2,
    note = 3
}
export declare abstract class Term extends _BaseTerm {
    readonly text: string;
    readonly variation: _Variation;
    protected constructor(bdd: BDD, text: string, variation: _Variation);
    abstract spaces(config: Config): string;
    abstract keyword(config: Config): string;
    abstract keywordPrefix(config: Config): string;
    abstract keywordSuffix(config: Config): string;
    abstract prefix(config: Config): string;
    abstract suffix(config: Config): string;
    protected _keywordVariation(config: Config): string | null;
    protected _keywordPrefixVariation(config: Config): string | null;
    protected _keywordSuffixVariation(config: Config): string | null;
    protected _prefixVariation(config: Config): string | null;
    protected _suffixVariation(config: Config): string | null;
    protected _padSize(config: Config): number;
    protected _keyword(config?: Config): string;
    protected _keyword_unpadded(term: string, config: Config): string;
    protected _capitalize(text: string): string;
    toString(config?: Config): string;
}
declare abstract class CodeTerm extends _BaseTerm {
    codeRun: CodeRun;
    protected constructor(bdd: BDD, codeRun: CodeRun);
}
export declare class BDD {
    feature?: Feature;
    terms: _BaseTerm[];
    _timeout?: number;
    _skip: boolean;
    codeRuns: CodeRun[];
    /**
     * Nulls means the test was not run yet.
     * True means it passed.
     * False means it did not pass.
     */
    passed: boolean[];
    constructor(feature?: Feature);
    addCode(code: CodeRun): void;
    /** Example: `List<Given> = bdd.allTerms<Given>().toList();` */
    allTerms<T extends Term>(type: {
        new (...args: any[]): T;
    }): Iterable<T>;
    /** The BDD description is its Scenario (or blank if there is no Scenario). */
    description(): string;
    /** A Bdd may have 0 or 1 examples. */
    example(): Example | undefined;
    /** A Bdd may have 0, 1, or more tables (which are not examples). */
    tables(): TableTerm[];
    /** The example, if it exists, may have any number of rows. */
    exampleRow(count: number | null): Set<Val> | null;
    numberOfExamples(): number;
    get skip(): BDD;
    /** Timeout in milliseconds */
    timeout(duration?: number): BDD;
    /** Timeout in seconds */
    timeoutSec(seconds: number): BDD;
    /**
     * The high-level description of a test case in Gherkin. It describes a
     * particular functionality or feature of the system being tested.
     */
    scenario(text: string): Scenario;
    /**
     * This keyword starts a step that sets up the initial context of the
     * scenario. It's used to describe the state of the world before you begin
     * the behavior you're specifying in this scenario. For example,
     * "Given I am logged into the website" sets the scene for the actions that follow.
     *
     * Note the use of `_` as some of the variables names, because we don't want
     * IDE editors to show them as "Parameter Name Hints".
     */
    given(_: string): Given;
    get textTerms(): Iterable<Term>;
    get codeTerms(): Iterable<CodeTerm>;
    toMap(config: Config): string[];
    toString(config?: Config, withFeature?: boolean): string;
}
declare class Scenario extends Term {
    constructor(bdd: BDD, text: string);
    get containsExample(): boolean;
    spaces(config: Config): string;
    keyword(config: Config): string;
    keywordPrefix(config: Config): string;
    keywordSuffix(config: Config): string;
    prefix(config: Config): string;
    suffix(config: Config): string;
    /**
     * This keyword starts a step that sets up the initial context of the
     * scenario. It's used to describe the state of the world before you begin
     * the behavior you're specifying in this scenario. For example,
     * "Given I am logged into the website" sets the scene for the actions that follow.
     *
     * Note the use of `_` as some of the variables names, because we don't want
     * IDE editors to show them as "Parameter Name Hints".
     */
    given(_: string): Given;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): Given;
    toString(config?: Config): string;
}
declare class Given extends Term {
    constructor(bdd: BDD, text: string, variation?: _Variation);
    static _internal(bdd: BDD, text: string, variation: _Variation): Given;
    spaces(config: Config): string;
    keyword(config: Config): string;
    keywordPrefix(config: Config): string;
    keywordSuffix(config: Config): string;
    prefix(config: Config): string;
    suffix(config: Config): string;
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row): GivenTable;
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): Given;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): Given;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): Given;
    /**
     * This keyword indicates the specific action taken by the user or the system.
     * It's the trigger for the behavior that you're specifying. For instance,
     * "When I click the 'Submit' button" describes the action taken after the
     * initial context is set by the 'Given' step.
     */
    when(_: string): When;
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_: string): Then;
    code(code: CodeRun): _GivenCode;
    toString(config?: Config): string;
}
declare class _GivenCode extends CodeTerm {
    constructor(bdd: BDD, code: CodeRun);
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): GivenTable;
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): Given;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): Given;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): Given;
    /**
     * This keyword indicates the specific action taken by the user or the system.
     * It's the trigger for the behavior that you're specifying. For instance,
     * "When I click the 'Submit' button" describes the action taken after the
     * initial context is set by the 'Given' step.
     */
    when(_: string): When;
    code(code: CodeRun): _GivenCode;
}
declare class When extends Term {
    constructor(bdd: BDD, text: string, variation?: _Variation);
    static _internal(bdd: BDD, text: string, variation: _Variation): When;
    spaces(config: Config): string;
    keyword(config: Config): string;
    keywordPrefix(config: Config): string;
    keywordSuffix(config: Config): string;
    prefix(config: Config): string;
    suffix(config: Config): string;
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): WhenTable;
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): When;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): When;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): When;
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_: string): Then;
    code(code: CodeRun): _WhenCode;
    run(code: CodeRun): void;
    toString(config?: Config): string;
}
declare class _WhenCode extends CodeTerm {
    constructor(bdd: BDD, code: CodeRun);
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): WhenTable;
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): When;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): When;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): When;
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_: string): Then;
    code(code: CodeRun): _WhenCode;
}
declare class Then extends Term {
    constructor(bdd: BDD, text: string, variation?: _Variation);
    protected static _internal(bdd: BDD, text: string, variation: _Variation): Then;
    spaces(config: Config): string;
    keyword(config: Config): string;
    keywordPrefix(config: Config): string;
    keywordSuffix(config: Config): string;
    prefix(config: Config): string;
    suffix(config: Config): string;
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): ThenTable;
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): Then;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): Then;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): Then;
    /**
     * Examples are used in the context of Scenario Outlines. A Scenario Outline
     * is a template for multiple tests, and the "Examples" section provides
     * concrete values to be substituted into the template for each test run.
     * This approach allows for the specification of multiple scenarios using the
     * same pattern of action but with different sets of data.
     *
     * Here’s how it works:
     *
     * Scenario Outline: This is a kind of scenario that is run multiple times
     * with different data. It includes variables in the Given-When-Then steps,
     * which are indicated with angle brackets, like <variable>.
     *
     * Examples: This keyword introduces a table right below the Scenario Outline.
     * Each row in this table (except the header) represents a set of values that
     * will be passed into the Scenario Outline’s variables. The header row
     * defines the names of these variables.
     *
     * For example, if you have a Scenario Outline describing the login process,
     * you might have variables for username and password. The Examples table
     * will then list different combinations of usernames and passwords to test
     * various login scenarios.
     *
     * This approach is particularly useful for testing the same feature or
     * functionality under different conditions and with different inputs,
     * making your tests more comprehensive and robust. It also keeps your
     * Gherkin feature files DRY (Don't Repeat Yourself), as you avoid writing
     * multiple scenarios that differ only in the data they use.
     *
     * ```
     *   Bdd(feature)
     *       .scenario('Buying and Selling stocks changes the average price.')
     *       .given('The user has <Quantity> shares of <Ticker> at <At> dollars each.')
     *       .when('The user <BuyOrSell> <How many> of these stock at <Price> for each share.')
     *       .then('The number of shares becomes <Quantity> plus/minus <How many>.')
     *       .and('The average price for the stock becomes <Average Price>.')
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 10),
     *         val('At', 100.00),
     *         val('BuyOrSell', BuyOrSell.buy),
     *         val('How many', 2),
     *         val('Price', 50.00),
     *         val('Average Price', 91.67),
     *       )
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 8),
     *         val('At', 200.00),
     *         val('BuyOrSell', BuyOrSell.sell),
     *         val('How many', 3),
     *         val('Price', 30.00),
     *         val('Average Price', 302.00),
     *       )
     *       .run((ctx) async { ...
     * ```
     */
    example(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val): Example;
    code(code: CodeRun): _ThenCode;
    run(code: CodeRun): void;
    testRun(code: CodeRun, reporter: BddReporter): BDD;
    toString(config?: Config): string;
}
declare class _ThenCode extends CodeTerm {
    constructor(bdd: BDD, code: CodeRun);
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): ThenTable;
    /**
     * Examples are used in the context of Scenario Outlines. A Scenario Outline
     * is a template for multiple tests, and the "Examples" section provides
     * concrete values to be substituted into the template for each test run.
     * This approach allows for the specification of multiple scenarios using the
     * same pattern of action but with different sets of data.
     *
     * Here’s how it works:
     *
     * Scenario Outline: This is a kind of scenario that is run multiple times
     * with different data. It includes variables in the Given-When-Then steps,
     * which are indicated with angle brackets, like <variable>.
     *
     * Examples: This keyword introduces a table right below the Scenario Outline.
     * Each row in this table (except the header) represents a set of values that
     * will be passed into the Scenario Outline’s variables. The header row
     * defines the names of these variables.
     *
     * For example, if you have a Scenario Outline describing the login process,
     * you might have variables for username and password. The Examples table
     * will then list different combinations of usernames and passwords to test
     * various login scenarios.
     *
     * This approach is particularly useful for testing the same feature or
     * functionality under different conditions and with different inputs,
     * making your tests more comprehensive and robust. It also keeps your
     * Gherkin feature files DRY (Don't Repeat Yourself), as you avoid writing
     * multiple scenarios that differ only in the data they use.
     *
     * ```
     *   Bdd(feature)
     *       .scenario('Buying and Selling stocks changes the average price.')
     *       .given('The user has <Quantity> shares of <Ticker> at <At> dollars each.')
     *       .when('The user <BuyOrSell> <How many> of these stock at <Price> for each share.')
     *       .then('The number of shares becomes <Quantity> plus/minus <How many>.')
     *       .and('The average price for the stock becomes <Average Price>.')
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 10),
     *         val('At', 100.00),
     *         val('BuyOrSell', BuyOrSell.buy),
     *         val('How many', 2),
     *         val('Price', 50.00),
     *         val('Average Price', 91.67),
     *       )
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 8),
     *         val('At', 200.00),
     *         val('BuyOrSell', BuyOrSell.sell),
     *         val('How many', 3),
     *         val('Price', 30.00),
     *         val('Average Price', 302.00),
     *       )
     *       .run((ctx) async { ...
     * ```
     */
    example(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val): Example;
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): When;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): When;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): When;
    code(code: CodeRun): _ThenCode;
    run(code: CodeRun): void;
    testRun(code: CodeRun, reporter: BddReporter): BDD;
}
export declare class TableTerm extends Term {
    tableName: string;
    rows: Row[];
    constructor(bdd: BDD, tableName: string);
    run(code: CodeRun): void;
    /**
     * Here we have something like:
     * [
     * { (number;123), (password;ABC) }
     * { (number;456), (password;XYZ) }
     * ]
     */
    formatTable(config: Config): string;
    spaces(config: Config): string;
    keyword(config: Config): string;
    keywordPrefix(config: Config): string;
    keywordSuffix(config: Config): string;
    prefix(config: Config): string;
    suffix(config: Config): string;
    toString(config?: Config): string;
}
declare class Example extends Term {
    rows: Set<Val>[];
    constructor(bdd: BDD, v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val);
    run(code: CodeRun): void;
    /**
     * Here we have something like:
     * [
     * { (number;123), (password;ABC) }
     * { (number;456), (password;XYZ) }
     * ]
     */
    formatExampleTable(config: Config): string;
    spaces(config: Config): string;
    keyword(config: Config): string;
    keywordPrefix(config: Config): string;
    keywordSuffix(config: Config): string;
    prefix(config: Config): string;
    suffix(config: Config): string;
    /**
     * Examples are used in the context of Scenario Outlines. A Scenario Outline
     * is a template for multiple tests, and the "Examples" section provides
     * concrete values to be substituted into the template for each test run.
     * This approach allows for the specification of multiple scenarios using the
     * same pattern of action but with different sets of data.
     *
     * Here’s how it works:
     *
     * Scenario Outline: This is a kind of scenario that is run multiple times
     * with different data. It includes variables in the Given-When-Then steps,
     * which are indicated with angle brackets, like <variable>.
     *
     * Examples: This keyword introduces a table right below the Scenario Outline.
     * Each row in this table (except the header) represents a set of values that
     * will be passed into the Scenario Outline’s variables. The header row
     * defines the names of these variables.
     *
     * For example, if you have a Scenario Outline describing the login process,
     * you might have variables for username and password. The Examples table
     * will then list different combinations of usernames and passwords to test
     * various login scenarios.
     *
     * This approach is particularly useful for testing the same feature or
     * functionality under different conditions and with different inputs,
     * making your tests more comprehensive and robust. It also keeps your
     * Gherkin feature files DRY (Don't Repeat Yourself), as you avoid writing
     * multiple scenarios that differ only in the data they use.
     *
     * ```
     *   Bdd(feature)
     *       .scenario('Buying and Selling stocks changes the average price.')
     *       .given('The user has <Quantity> shares of <Ticker> at <At> dollars each.')
     *       .when('The user <BuyOrSell> <How many> of these stock at <Price> for each share.')
     *       .then('The number of shares becomes <Quantity> plus/minus <How many>.')
     *       .and('The average price for the stock becomes <Average Price>.')
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 10),
     *         val('At', 100.00),
     *         val('BuyOrSell', BuyOrSell.buy),
     *         val('How many', 2),
     *         val('Price', 50.00),
     *         val('Average Price', 91.67),
     *       )
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 8),
     *         val('At', 200.00),
     *         val('BuyOrSell', BuyOrSell.sell),
     *         val('How many', 3),
     *         val('Price', 30.00),
     *         val('Average Price', 302.00),
     *       )
     *       .run((ctx) async { ...
     * ```
     */
    example(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val): Example;
    testRun(code: CodeRun, reporter: BddReporter): BDD;
    toString(config?: Config): string;
}
declare class GivenTable extends TableTerm {
    constructor(bdd: BDD, tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row);
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): Given;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): Given;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): Given;
    /**
     * This keyword indicates the specific action taken by the user or the system.
     * It's the trigger for the behavior that you're specifying. For instance,
     * "When I click the 'Submit' button" describes the action taken after the
     * initial context is set by the 'Given' step.
     */
    when(_: string): When;
    code(code: CodeRun): _GivenCode;
    toString(config?: Config): string;
}
declare class WhenTable extends TableTerm {
    constructor(bdd: BDD, tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row);
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): When;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): When;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): When;
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_: string): Then;
    code(code: CodeRun): _WhenCode;
    toString(config?: Config): string;
}
declare class ThenTable extends TableTerm {
    constructor(bdd: BDD, tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row);
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_: string): Then;
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_: string): Then;
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_: string): Then;
    /**
     * Examples are used in the context of Scenario Outlines. A Scenario Outline
     * is a template for multiple tests, and the "Examples" section provides
     * concrete values to be substituted into the template for each test run.
     * This approach allows for the specification of multiple scenarios using the
     * same pattern of action but with different sets of data.
     *
     * Here’s how it works:
     *
     * Scenario Outline: This is a kind of scenario that is run multiple times
     * with different data. It includes variables in the Given-When-Then steps,
     * which are indicated with angle brackets, like <variable>.
     *
     * Examples: This keyword introduces a table right below the Scenario Outline.
     * Each row in this table (except the header) represents a set of values that
     * will be passed into the Scenario Outline’s variables. The header row
     * defines the names of these variables.
     *
     * For example, if you have a Scenario Outline describing the login process,
     * you might have variables for username and password. The Examples table
     * will then list different combinations of usernames and passwords to test
     * various login scenarios.
     *
     * This approach is particularly useful for testing the same feature or
     * functionality under different conditions and with different inputs,
     * making your tests more comprehensive and robust. It also keeps your
     * Gherkin feature files DRY (Don't Repeat Yourself), as you avoid writing
     * multiple scenarios that differ only in the data they use.
     *
     * ```
     *   Bdd(feature)
     *       .scenario('Buying and Selling stocks changes the average price.')
     *       .given('The user has <Quantity> shares of <Ticker> at <At> dollars each.')
     *       .when('The user <BuyOrSell> <How many> of these stock at <Price> for each share.')
     *       .then('The number of shares becomes <Quantity> plus/minus <How many>.')
     *       .and('The average price for the stock becomes <Average Price>.')
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 10),
     *         val('At', 100.00),
     *         val('BuyOrSell', BuyOrSell.buy),
     *         val('How many', 2),
     *         val('Price', 50.00),
     *         val('Average Price', 91.67),
     *       )
     *       .example(
     *         val('Ticker', 'IBM'),
     *         val('Quantity', 8),
     *         val('At', 200.00),
     *         val('BuyOrSell', BuyOrSell.sell),
     *         val('How many', 3),
     *         val('Price', 30.00),
     *         val('Average Price', 302.00),
     *       )
     *       .run((ctx) async { ...
     * ```
     */
    example(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val): Example;
    code(code: CodeRun): _ThenCode;
    toString(config?: Config): string;
    run(code: CodeRun): void;
    testRun(code: CodeRun, reporter: BddReporter): BDD;
}
declare type CodeRun = ((ctx: Context) => Promise<void> | void) | undefined;
export {};
//# sourceMappingURL=Bdd.d.ts.map