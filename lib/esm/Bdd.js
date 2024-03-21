/* eslint-disable @typescript-eslint/no-shadow */
// noinspection JSUnusedGlobalSymbols,UnnecessaryLocalVariableJS,DuplicatedCode
import { test } from '@jest/globals';
import { TableValues } from "./TableValues";
import { Context } from "./Context";
import { BddReporter } from "./BddReporter";
import { Config } from "./Config";
import { Keywords } from "./Keywords";
import { BddError } from "./BddError";
import { MultipleTableValues } from "./MultipleTableValues";
export class TableRows {
    _values;
    constructor(values) {
        this._values = values;
    }
    /**
     * Example:
     * ctx.table('notifications').row(0).val('read') as bool;
     */
    row(index) {
        if (index < 0 || index >= this._values.length)
            throw new BddError(`You can't get table row(${index}), since range is 0..${this._values.length}.`);
        else
            return this._values[index];
    }
    /**
     * Return the first row it finds with the given name/value pair. Example:
     * ctx.table('notifications').rowWhere(name: 'property', value: 'lastPrice').val('market') as Money;
     * If no name/value pair is found, an error is thrown.
     */
    rowWhere(name, value) {
        const foundRow = this._values.find((btv) => btv.val(name) === value);
        if (!foundRow) {
            throw new BddError(`There is no table with name:"${name}" and value: "${value}".`);
        }
        return foundRow;
    }
    /**
     * Example:
     * ctx.table('notifications').rows;
     */
    get rows() {
        return [...this._values];
    }
    toString() {
        return `BddTableRows{${this._values}}`;
    }
}
export function Bdd(feature) {
    return new BDD(feature);
}
class _BaseTerm {
    bdd;
    constructor(bdd) {
        this.bdd = bdd;
        bdd.terms.push(this);
    }
}
var _Variation;
(function (_Variation) {
    _Variation[_Variation["term"] = 0] = "term";
    _Variation[_Variation["and"] = 1] = "and";
    _Variation[_Variation["but"] = 2] = "but";
    _Variation[_Variation["note"] = 3] = "note";
})(_Variation || (_Variation = {}));
export class Term extends _BaseTerm {
    text;
    variation;
    constructor(bdd, text, variation) {
        super(bdd);
        this.text = text;
        this.variation = variation;
    }
    _keywordVariation(config) {
        return (this.variation === _Variation.and)
            ? config.keywords.and
            : (this.variation === _Variation.but)
                ? config.keywords.but
                : (this.variation === _Variation.note)
                    ? config.keywords.comment
                    : null;
    }
    _keywordPrefixVariation(config) {
        return (this.variation === _Variation.and)
            ? config.keywordPrefix.and
            : (this.variation === _Variation.but)
                ? config.keywordPrefix.but
                : (this.variation === _Variation.note)
                    ? config.keywordPrefix.comment
                    : null;
    }
    _keywordSuffixVariation(config) {
        return (this.variation === _Variation.and)
            ? config.keywordSuffix.and
            : (this.variation === _Variation.but)
                ? config.keywordSuffix.but
                : (this.variation === _Variation.note)
                    ? config.keywordSuffix.comment
                    : null;
    }
    _prefixVariation(config) {
        return (this.variation === _Variation.and)
            ? config.prefix.and
            : (this.variation === _Variation.but)
                ? config.prefix.but
                : (this.variation === _Variation.note)
                    ? config.prefix.comment
                    : null;
    }
    _suffixVariation(config) {
        return (this.variation === _Variation.and)
            ? config.suffix.and
            : (this.variation === _Variation.but)
                ? config.suffix.but
                : (this.variation === _Variation.note)
                    ? config.suffix.comment
                    : null;
    }
    _padSize(config) {
        return Math.max(Math.max(Math.max(Math.max(config.keywords.given.length, config.keywords.then.length), config.keywords.when.length), config.keywords.and.length), config.keywords.but.length);
    }
    _keyword(config = Config._default) {
        let term = this.keyword(config);
        let result = this._keyword_unpadded(term, config);
        if (config.rightAlignKeywords) {
            let padSize = this._padSize(config);
            result = result.padStart(padSize, config.padChar);
        }
        return result;
    }
    _keyword_unpadded(term, config) {
        if (this.variation === _Variation.term)
            return term;
        else if (this.variation === _Variation.and)
            return config.keywords.and;
        else if (this.variation === _Variation.but)
            return config.keywords.but;
        else if (this.variation === _Variation.note)
            return config.keywords.comment;
        else
            throw new BddError(this.variation);
    }
    _capitalize(text) {
        if (this.variation === _Variation.note) {
            const characters = Array.from(text);
            return characters[0].toUpperCase() + characters.slice(1).join('');
        }
        else {
            return text;
        }
    }
    toString(config = Config._default) {
        return this.keywordPrefix(config) +
            this.spaces(config) +
            this._keyword(config) +
            this.keywordSuffix(config) +
            ' ' +
            this.prefix(config) +
            this._capitalize(this.text) +
            this.suffix(config);
    }
}
class CodeTerm extends _BaseTerm {
    codeRun;
    constructor(bdd, codeRun) {
        super(bdd);
        this.codeRun = codeRun;
    }
}
export class BDD {
    feature;
    terms;
    _timeout;
    _skip;
    codeRuns;
    /**
     * Nulls means the test was not run yet.
     * True means it passed.
     * False means it did not pass.
     */
    passed;
    constructor(feature) {
        this.feature = feature;
        this.terms = [];
        this._timeout = undefined;
        this._skip = false;
        this.codeRuns = [];
        this.passed = [];
    }
    addCode(code) {
        this.codeRuns.push(code);
    }
    /** Example: `List<Given> = bdd.allTerms<Given>().toList();` */
    allTerms(type) {
        return this.terms.filter(term => term instanceof type);
    }
    /** The BDD description is its Scenario (or blank if there is no Scenario). */
    description() {
        const scenarioIterator = this.allTerms(Scenario)[Symbol.iterator]();
        const scenario = scenarioIterator.next().value;
        return scenario ? scenario.text : '';
    }
    /** A Bdd may have 0 or 1 examples. */
    example() {
        const exampleIterator = this.allTerms(Example)[Symbol.iterator]();
        return exampleIterator.next().value;
    }
    /** A Bdd may have 0, 1, or more tables (which are not examples). */
    tables() {
        return Array.from(this.allTerms(TableTerm));
    }
    /** The example, if it exists, may have any number of rows. */
    exampleRow(count) {
        return (count === null) ? null : (this.example()?.rows[count] ?? null);
    }
    numberOfExamples() {
        const example = this.example();
        return example ? example.rows.length : 0;
    }
    get skip() {
        this._skip = true;
        return this;
    }
    /** Timeout in milliseconds */
    timeout(duration) {
        this._timeout = duration;
        return this;
    }
    /** Timeout in seconds */
    timeoutSec(seconds) {
        return this.timeout(seconds * 1000); // Convert seconds to milliseconds
    }
    /**
     * The high-level description of a test case in Gherkin. It describes a
     * particular functionality or feature of the system being tested.
     */
    scenario(text) {
        return new Scenario(this, text);
    }
    /**
     * This keyword starts a step that sets up the initial context of the
     * scenario. It's used to describe the state of the world before you begin
     * the behavior you're specifying in this scenario. For example,
     * "Given I am logged into the website" sets the scene for the actions that follow.
     *
     * Note the use of `_` as some of the variables names, because we don't want
     * IDE editors to show them as "Parameter Name Hints".
     */
    given(_) {
        return new Given(this, _);
    }
    get textTerms() {
        return this.terms.filter(term => term instanceof Term);
    }
    get codeTerms() {
        return this.terms.filter(term => term instanceof CodeTerm);
    }
    toMap(config) {
        return Array.from(this.textTerms).map(term => term.toString(config));
    }
    toString(config = Config._default, withFeature = false) {
        const featureString = withFeature ? this.feature?.toString(config) ?? '' : '';
        const termsString = this.toMap(config).join(config.endOfLineChar);
        return featureString + termsString + config.endOfLineChar;
    }
}
class Scenario extends Term {
    constructor(bdd, text) {
        super(bdd, text, _Variation.term);
    }
    get containsExample() {
        return this.bdd.terms.some((term) => term instanceof Example);
    }
    spaces(config) {
        return config.spaces;
    }
    keyword(config) {
        return this.containsExample
            ? config.keywords.scenarioOutline
            : config.keywords.scenario;
    }
    keywordPrefix(config) {
        return this.containsExample
            ? config.keywordPrefix.scenarioOutline
            : config.keywordPrefix.scenario;
    }
    keywordSuffix(config) {
        return this.containsExample
            ? config.keywordSuffix.scenarioOutline
            : config.keywordSuffix.scenario;
    }
    prefix(config) {
        return this.containsExample
            ? config.prefix.scenarioOutline
            : config.prefix.scenario;
    }
    suffix(config) {
        return this.containsExample
            ? config.suffix.scenarioOutline
            : config.suffix.scenario;
    }
    /**
     * This keyword starts a step that sets up the initial context of the
     * scenario. It's used to describe the state of the world before you begin
     * the behavior you're specifying in this scenario. For example,
     * "Given I am logged into the website" sets the scene for the actions that follow.
     *
     * Note the use of `_` as some of the variables names, because we don't want
     * IDE editors to show them as "Parameter Name Hints".
     */
    given(_) {
        return new Given(this.bdd, _);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return new Given(this.bdd, _, _Variation.note);
    }
    toString(config = Config._default) {
        return super.toString(config);
    }
}
class Given extends Term {
    constructor(bdd, text, variation = _Variation.term) {
        super(bdd, text, variation);
    }
    static _internal(bdd, text, variation) {
        return new Given(bdd, text, variation);
    }
    spaces(config) {
        return config.spaces + config.spaces;
    }
    keyword(config) {
        return this._keywordVariation(config) ?? config.keywords.given;
    }
    keywordPrefix(config) {
        return this._keywordPrefixVariation(config) ?? config.keywordPrefix.given;
    }
    keywordSuffix(config) {
        return this._keywordSuffixVariation(config) ?? config.keywordSuffix.given;
    }
    prefix(config) {
        return this._prefixVariation(config) ?? config.prefix.given;
    }
    suffix(config) {
        return this._suffixVariation(config) ?? config.suffix.given;
    }
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16) {
        return new GivenTable(this.bdd, tableName, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16);
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return Given._internal(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return Given._internal(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return Given._internal(this.bdd, _, _Variation.note);
    }
    /**
     * This keyword indicates the specific action taken by the user or the system.
     * It's the trigger for the behavior that you're specifying. For instance,
     * "When I click the 'Submit' button" describes the action taken after the
     * initial context is set by the 'Given' step.
     */
    when(_) {
        return new When(this.bdd, _);
    }
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_) {
        return new Then(this.bdd, _);
    }
    code(code) {
        return new _GivenCode(this.bdd, code);
    }
    toString(config = Config._default) {
        return super.toString(config);
    }
}
class _GivenCode extends CodeTerm {
    constructor(bdd, code) {
        super(bdd, code);
    }
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName, row1, row2, row3, row4) {
        return new GivenTable(this.bdd, tableName, row1, row2, row3, row4);
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return Given._internal(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return Given._internal(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return Given._internal(this.bdd, _, _Variation.note);
    }
    /**
     * This keyword indicates the specific action taken by the user or the system.
     * It's the trigger for the behavior that you're specifying. For instance,
     * "When I click the 'Submit' button" describes the action taken after the
     * initial context is set by the 'Given' step.
     */
    when(_) {
        return new When(this.bdd, _);
    }
    code(code) {
        return new _GivenCode(this.bdd, code);
    }
}
class When extends Term {
    constructor(bdd, text, variation = _Variation.term) {
        super(bdd, text, variation);
    }
    static _internal(bdd, text, variation) {
        return new When(bdd, text, variation);
    }
    spaces(config) {
        return config.spaces + config.spaces;
    }
    keyword(config) {
        return this._keywordVariation(config) ?? config.keywords.when;
    }
    keywordPrefix(config) {
        return this._keywordPrefixVariation(config) ?? config.keywordPrefix.when;
    }
    keywordSuffix(config) {
        return this._keywordSuffixVariation(config) ?? config.keywordSuffix.when;
    }
    prefix(config) {
        return this._prefixVariation(config) ?? config.prefix.when;
    }
    suffix(config) {
        return this._suffixVariation(config) ?? config.suffix.when;
    }
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName, row1, row2, row3, row4) {
        return new WhenTable(this.bdd, tableName, row1, row2, row3, row4);
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return When._internal(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return When._internal(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return When._internal(this.bdd, _, _Variation.note);
    }
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_) {
        return new Then(this.bdd, _);
    }
    code(code) {
        return new _WhenCode(this.bdd, code);
    }
    run(code) {
        new _Run().run(this.bdd, code);
    }
    toString(config = Config._default) {
        return super.toString(config);
    }
}
class _WhenCode extends CodeTerm {
    constructor(bdd, code) {
        super(bdd, code);
    }
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName, row1, row2, row3, row4) {
        return new WhenTable(this.bdd, tableName, row1, row2, row3, row4);
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return When._internal(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return When._internal(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return When._internal(this.bdd, _, _Variation.note);
    }
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_) {
        return new Then(this.bdd, _);
    }
    code(code) {
        return new _WhenCode(this.bdd, code);
    }
}
class Then extends Term {
    constructor(bdd, text, variation = _Variation.term) {
        super(bdd, text, variation);
    }
    static _internal(bdd, text, variation) {
        return new Then(bdd, text, variation);
    }
    spaces(config) {
        return config.spaces + config.spaces;
    }
    keyword(config) {
        return this._keywordVariation(config) ?? config.keywords.then;
    }
    keywordPrefix(config) {
        return this._keywordPrefixVariation(config) ?? config.keywordPrefix.then;
    }
    keywordSuffix(config) {
        return this._keywordSuffixVariation(config) ?? config.keywordSuffix.then;
    }
    prefix(config) {
        return this._prefixVariation(config) ?? config.prefix.then;
    }
    suffix(config) {
        return this._suffixVariation(config) ?? config.suffix.then;
    }
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName, row1, row2, row3, row4) {
        return new ThenTable(this.bdd, tableName, row1, row2, row3, row4);
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return Then._internal(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return Then._internal(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return Then._internal(this.bdd, _, _Variation.note);
    }
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
    example(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
        return new Example(this.bdd, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15);
    }
    code(code) {
        return new _ThenCode(this.bdd, code);
    }
    run(code) {
        new _Run().run(this.bdd, code);
    }
    testRun(code, reporter) {
        new _TestRun(code, reporter).run(this.bdd);
        return this.bdd;
    }
    toString(config = Config._default) {
        return super.toString(config);
    }
}
class _ThenCode extends CodeTerm {
    constructor(bdd, code) {
        super(bdd, code);
    }
    /**
     * A table must have a name and rows. The name is necessary if you want to
     * read the values from it later (if not, just pass an empty string).
     * Example: `ctx.table('notifications').row(0).val('read') as bool`.
     */
    table(tableName, row1, row2, row3, row4) {
        return new ThenTable(this.bdd, tableName, row1, row2, row3, row4);
    }
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
    example(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
        return new Example(this.bdd, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15);
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return When._internal(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return When._internal(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return When._internal(this.bdd, _, _Variation.note);
    }
    code(code) {
        return new _ThenCode(this.bdd, code);
    }
    run(code) {
        new _Run().run(this.bdd, code);
    }
    testRun(code, reporter) {
        new _TestRun(code, reporter).run(this.bdd);
        return this.bdd;
    }
}
export class TableTerm extends Term {
    tableName;
    rows = [];
    constructor(bdd, tableName) {
        super(bdd, '', _Variation.term);
        this.tableName = tableName;
    }
    run(code) {
        new _Run().run(this.bdd, code);
    }
    /**
     * Here we have something like:
     * [
     * { (number;123), (password;ABC) }
     * { (number;456), (password;XYZ) }
     * ]
     */
    formatTable(config) {
        let sizes = {};
        for (let _row of this.rows) {
            for (let value of _row.values) {
                let maxValue1 = sizes[value.name];
                let maxValue2 = Math.max(value.name.length, value.toString(config).length);
                let maxValue = (maxValue1 === undefined) ? maxValue2 : Math.max(maxValue1, maxValue2);
                sizes[value.name] = maxValue;
            }
        }
        let spaces = config.spaces;
        let space = config.space;
        let endOfLineChar = config.endOfLineChar;
        let tableDivider = config.tableDivider;
        let rightAlignPadding = spaces +
            spaces +
            spaces +
            ((config.rightAlignKeywords) ? config.padChar.repeat(4) : '');
        let header = rightAlignPadding +
            `${tableDivider}${space}` +
            this.rows[0].values.map(value => {
                let length = sizes[value.name] ?? 50;
                return value.name.padEnd(length, space);
            }).join(`${space}${tableDivider}${space}`) +
            `${space}${tableDivider}`;
        let rowsStr = this.rows.map(row => {
            return rightAlignPadding +
                `${tableDivider}${space}` +
                row.values.map(value => {
                    let length = sizes[value.name] ?? 50;
                    return value.toString(config).padEnd(length, space);
                }).join(`${space}${tableDivider}${space}`) +
                `${space}${tableDivider}`;
        });
        let result = `${header}${endOfLineChar}` +
            `${rowsStr.join(endOfLineChar)}`;
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    spaces(config) {
        return '';
    }
    keyword(config) {
        return config.keywords.table;
    }
    keywordPrefix(config) {
        return config.keywordPrefix.table;
    }
    keywordSuffix(config) {
        return config.keywordSuffix.table;
    }
    prefix(config) {
        return config.prefix.table;
    }
    suffix(config) {
        return config.suffix.table;
    }
    toString(config = Config._default) {
        return this.keywordPrefix(config) +
            this.keyword(config) +
            this.keywordSuffix(config) +
            this.prefix(config) +
            this.formatTable(config) +
            this.suffix(config);
    }
}
class Example extends Term {
    // Rows is an array of Set objects containing values.
    rows = [];
    constructor(bdd, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
        super(bdd, '', _Variation.term);
        const set = new Set([v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15]
            .filter(v => (v !== undefined) && (v !== null)));
        this.rows.push(set);
    }
    run(code) {
        new _Run().run(this.bdd, code);
    }
    /**
     * Here we have something like:
     * [
     * { (number;123), (password;ABC) }
     * { (number;456), (password;XYZ) }
     * ]
     */
    formatExampleTable(config) {
        let sizes = {};
        this.rows.forEach(row => {
            row.forEach(value => {
                let maxValue1 = sizes[value.name];
                let maxValue2 = Math.max(value.name.length, value.toString(config).length);
                let maxValue = (maxValue1 === undefined) ? maxValue2 : Math.max(maxValue1, maxValue2);
                sizes[value.name] = maxValue;
            });
        });
        const { spaces, space, endOfLineChar, tableDivider, padChar, rightAlignKeywords } = config;
        const rightAlignPadding = spaces + spaces + spaces + (rightAlignKeywords ? padChar.repeat(4) : '');
        const header = rightAlignPadding + tableDivider + space +
            Array.from(this.rows.values().next().value).map((value) => {
                const length = sizes[value.name] ?? 50;
                return value.name.padEnd(length, space);
            }).join(space + tableDivider + space) + space + tableDivider;
        const rowsStr = this.rows.map((row) => {
            return rightAlignPadding + tableDivider + space +
                Array.from(row).map((value) => {
                    const length = sizes[value.name] ?? 50;
                    return value.toString(config).padEnd(length, space);
                }).join(space + tableDivider + space) + space + tableDivider;
        });
        return header + endOfLineChar + rowsStr.join(endOfLineChar);
    }
    spaces(config) {
        return config.spaces + config.spaces;
    }
    keyword(config) {
        return this._keywordVariation(config) ?? config.keywords.examples;
    }
    keywordPrefix(config) {
        return this._keywordPrefixVariation(config) ?? config.keywordPrefix.examples;
    }
    keywordSuffix(config) {
        return this._keywordSuffixVariation(config) ?? config.keywordSuffix.examples;
    }
    prefix(config) {
        return this._prefixVariation(config) ?? config.prefix.examples;
    }
    suffix(config) {
        return this._suffixVariation(config) ?? config.suffix.examples;
    }
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
    example(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
        const set = new Set([v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15]
            .filter(v => (v !== undefined) && (v !== null)));
        this.rows.push(set);
        return this;
    }
    // Visible for testing.
    testRun(code, reporter) {
        new _TestRun(code, reporter).run(this.bdd);
        return this.bdd;
    }
    // Examples have a special toString treatment.
    toString(config = Config._default) {
        return this.keywordPrefix(config) +
            this.spaces(config) +
            this.keyword(config) +
            this.keywordSuffix(config) +
            ' ' +
            this.prefix(config) +
            config.endOfLineChar +
            this.formatExampleTable(config) +
            this.suffix(config);
    }
}
class GivenTable extends TableTerm {
    constructor(bdd, tableName, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16) {
        super(bdd, tableName);
        this.rows.push(...[
            row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16,
        ].filter(row => (row !== null) && (row !== undefined)));
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return new Given(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return new Given(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return new Given(this.bdd, _, _Variation.note);
    }
    /**
     * This keyword indicates the specific action taken by the user or the system.
     * It's the trigger for the behavior that you're specifying. For instance,
     * "When I click the 'Submit' button" describes the action taken after the
     * initial context is set by the 'Given' step.
     */
    when(_) {
        return new When(this.bdd, _);
    }
    code(code) {
        return new _GivenCode(this.bdd, code);
    }
    toString(config = Config._default) {
        return super.toString(config);
    }
}
class WhenTable extends TableTerm {
    // Constructor with optional parameters
    constructor(bdd, tableName, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16) {
        super(bdd, tableName);
        this.rows.push(...[
            row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16,
        ].filter(row => (row !== null) && (row !== undefined)));
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return When._internal(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return When._internal(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return When._internal(this.bdd, _, _Variation.note);
    }
    /**
     * This keyword is used to describe the expected outcome or result after the
     * 'When' step is executed. It's used to assert that a certain outcome should
     * occur, which helps to validate whether the system behaves as expected.
     * An example is, "Then I should be redirected to the dashboard".
     */
    then(_) {
        return new Then(this.bdd, _);
    }
    code(code) {
        return new _WhenCode(this.bdd, code);
    }
    // Overriding the toString method
    toString(config = Config._default) {
        return super.toString(config);
    }
}
class ThenTable extends TableTerm {
    constructor(bdd, tableName, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16) {
        super(bdd, tableName);
        this.rows.push(...[
            row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16,
        ].filter(row => (row !== null) && (row !== undefined)));
    }
    /**
     * This keyword is used to extend a 'Given', 'When', or 'Then' step.
     * It allows you to add multiple conditions or actions in the same step
     * without having to repeat the 'Given', 'When', or 'Then' keyword.
     * For example, "And I should see a confirmation message" could follow
     * a 'Then' step to further specify the expected outcomes.
     */
    and(_) {
        return new Then(this.bdd, _, _Variation.and);
    }
    /**
     * This keyword is used similarly to "And," but it is typically used for
     * negative conditions or to express a contrast with the previous step.
     * It's a way to extend a "Given," "When," or "Then" step with an additional
     * condition that contrasts with what was previously stated. For example,
     * after a "Then" step, you might have "But I should not be logged out."
     * This helps in creating more comprehensive scenarios by covering both
     * what should happen and what should not happen under certain conditions.
     */
    but(_) {
        return new Then(this.bdd, _, _Variation.but);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the scenario
     * or steps. Comments in Gherkin are usually marked with a hashtag (#) and
     * are ignored when the tests are executed. A "Note" can be useful for
     * giving context or explaining the rationale behind a certain test scenario,
     * making it easier for others to understand the purpose and scope of the test.
     */
    note(_) {
        return new Then(this.bdd, _, _Variation.note);
    }
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
    example(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
        return new Example(this.bdd, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15);
    }
    code(code) {
        return new _ThenCode(this.bdd, code);
    }
    toString(config = Config._default) {
        return super.toString(config);
    }
    run(code) {
        new _Run().run(this.bdd, code);
    }
    testRun(code, reporter) {
        new _TestRun(code, reporter).run(this.bdd);
        return this.bdd;
    }
}
/** This will run with the global reporter/runInfo. */
class _Run {
    run(bdd, code) {
        // Add the code to the BDD, as a ThenCode.
        // eslint-disable-next-line no-new
        new _ThenCode(bdd, code);
        BddReporter._reporters.forEach((_reporter) => {
            _reporter._addBdd(bdd);
        });
        const numberOfExamples = bdd.numberOfExamples();
        BddReporter.runInfo.testCount++;
        if (numberOfExamples === 0) {
            this._runTheTest(bdd, null);
        }
        else {
            for (let i = 0; i < numberOfExamples; i++) {
                this._runTheTest(bdd, i);
            }
        }
    }
    static red = '\x1B[38;5;9m';
    static blue = '\x1B[38;5;45m';
    static yellow = '\x1B[38;5;226m';
    static grey = '\x1B[38;5;246m';
    static bold = '\u001b[1m';
    static italic = '\u001b[3m';
    static boldItalic = _Run.bold + _Run.italic;
    static boldOff = '\u001b[22m';
    static italicOff = '\u001b[23m';
    static boldItalicOff = _Run.boldOff + _Run.italicOff;
    static reset = '\u001b[0m';
    static config = new Config({
        keywords: new Keywords({
            feature: `${_Run.boldItalic}Feature:${_Run.boldItalicOff}`,
            scenario: `${_Run.boldItalic}Scenario:${_Run.boldItalicOff}`,
            scenarioOutline: `${_Run.boldItalic}Scenario Outline:${_Run.boldItalicOff}`,
            given: `${_Run.boldItalic}Given${_Run.boldItalicOff}`,
            when: `${_Run.boldItalic}When${_Run.boldItalicOff}`,
            then: `${_Run.boldItalic}Then${_Run.boldItalicOff}`,
            and: `${_Run.boldItalic}And${_Run.boldItalicOff}`,
            but: `${_Run.boldItalic}But${_Run.boldItalicOff}`,
            comment: `${_Run.boldItalic}#${_Run.boldItalicOff}`,
            examples: `${_Run.boldItalic}Examples:${_Run.boldItalicOff}`,
        }),
        keywordPrefix: new Keywords({
            feature: '',
            scenario: '\n',
            scenarioOutline: '\n',
            given: '\n',
            when: '\n',
            then: '\n',
            and: '',
            but: '',
            comment: _Run.grey,
            examples: '\n',
            table: '',
        }),
        suffix: new Keywords({
            feature: '',
            scenario: '',
            scenarioOutline: '',
            given: '',
            when: '',
            then: '',
            and: '',
            but: '',
            comment: _Run.blue,
            examples: '',
            table: '',
        }),
    });
    subscript(index) {
        let result = '';
        const x = index.toString();
        for (let i = 0; i < x.length; i++) {
            const char = x[i];
            result += {
                '0': '₀',
                '1': '₁',
                '2': '₂',
                '3': '₃',
                '4': '₄',
                '5': '₅',
                '6': '₆',
                '7': '₇',
                '8': '₈',
                '9': '₉',
            }[char];
        }
        return result;
    }
    /**  Returns something like: "4₁₂" */
    testCountStr(testCount, exampleNumber) {
        return `${testCount}${exampleNumber === null ? '' : this.subscript(exampleNumber + 1)}`;
    }
    /**
     * If the Bdd has examples, this method will be called once for each example, with
     * [exampleNumber] starting in 0.
     *
     * If the Bdd does NOT have examples, this method will run once, with [exampleNumber] null.
     */
    _runTheTest(bdd, exampleNumber) {
        BddReporter.runInfo.totalTestCount++;
        let currentExecution = 0;
        const bddStr = bdd.toString(_Run.config, true);
        const testCount = BddReporter.runInfo.testCount;
        const _testCountStr = this.testCountStr(testCount, exampleNumber);
        const _testName = `${_testCountStr} ${bdd.description()}`;
        // Test is skipped.
        if (bdd._skip) {
            BddReporter.runInfo.skipCount++;
            // eslint-disable-next-line jest/no-disabled-tests
            test.skip(_testName, async () => {
            });
        }
        //
        // Test is NOT skipped.
        else {
            // We delegate to Jest to actually run the test.
            test(
            //
            // Test name:
            _testName, 
            //
            // Test code:
            async () => {
                currentExecution++;
                process.stdout.write(((currentExecution === 1)
                    ? `\n${this._header(bdd._skip, _testCountStr)}${_Run.blue}${bddStr}${_Run.boldOff}`
                    : `\n${_Run.red}Retry ${currentExecution}.\n${_Run.boldOff}`) + '\n');
                const example = TableValues.from(bdd.exampleRow(exampleNumber));
                const tables = MultipleTableValues.from(bdd.tables());
                const ctx = new Context(example, tables);
                try {
                    // TODO: REMOVE:
                    // for (const codeTerm of bdd.codeTerms) {
                    //   if (codeTerm.codeRun) {
                    //     await codeTerm.codeRun(ctx);
                    //   }
                    // }
                    for (const codeTerm of Array.from(bdd.codeTerms)) {
                        if (codeTerm.codeRun) {
                            await codeTerm.codeRun(ctx);
                        }
                    }
                }
                catch (error) {
                    bdd.passed.push(false);
                    BddReporter.runInfo.failedCount++;
                    throw error;
                }
                bdd.passed.push(true);
                BddReporter.runInfo.passedCount++;
            }, 
            //
            // Timeout:
            bdd._timeout);
        }
    }
    _header(skip, testNumberStr) {
        return `${_Run.yellow}${_Run.italic}TEST ${testNumberStr} ${skip ? 'SKIPPED' : ''} ${_Run.italicOff}══════════════════════════════════════════════════${_Run.reset}\n\n`;
    }
}
/** This is for testing the Easy BDD Tool only. */
class _TestRun {
    code;
    reporter;
    constructor(code, reporter) {
        this.code = code;
        this.reporter = reporter;
    }
    run(bdd) {
        // Add the code to the BDD, as a ThenCode.
        // eslint-disable-next-line no-new
        new _ThenCode(bdd, this.code);
        if (this.reporter) {
            this.reporter._addBdd(bdd);
        }
        const numberOfExamples = bdd.numberOfExamples();
        if (numberOfExamples === 0) {
            this._runTheTest(bdd, null);
        }
        else {
            for (let i = 0; i < numberOfExamples; i++) {
                this._runTheTest(bdd, i);
            }
        }
    }
    _runTheTest(bdd, exampleNumber) {
        const example = TableValues.from(bdd.exampleRow(exampleNumber));
        const tables = MultipleTableValues.from(bdd.tables());
        const ctx = new Context(example, tables);
        if (!bdd.skip) {
            try {
                // Run all bdd code.
                const codeRuns = Array.from(bdd.codeTerms).map((codeTerm) => codeTerm.codeRun);
                for (const codeRun of codeRuns) {
                    if (codeRun) {
                        codeRun(ctx);
                    }
                }
                bdd.passed.push(true);
            }
            catch (error) {
                bdd.passed.push(false);
            }
        }
    }
}
