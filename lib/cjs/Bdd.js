"use strict";
// noinspection JSUnusedGlobalSymbols,UnnecessaryLocalVariableJS,DuplicatedCode
Object.defineProperty(exports, "__esModule", { value: true });
exports.Background = exports.TableTerm = exports.BDD = exports.CodeTerm = exports.Term = void 0;
exports.Bdd = Bdd;
const Config_1 = require("./Config");
const BddError_1 = require("./BddError");
const BddRunner_1 = require("./BddRunner");
const gherkin_1 = require("./gherkin");
function Bdd(feature) {
    return new BDD(feature);
}
class _BaseTerm {
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
class Term extends _BaseTerm {
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
    _keyword(config = Config_1.Config._default) {
        const term = this.keyword(config);
        let result = this._keyword_unpadded(term, config);
        if (config.rightAlignKeywords) {
            const padSize = this._padSize(config);
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
            throw new BddError_1.BddError(this.variation);
    }
    /** Whether this term is a note, added with `.note()`. */
    get isNote() {
        return this.variation === _Variation.note;
    }
    /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
    get isStep() {
        return false;
    }
    _capitalize(text) {
        if (this.variation === _Variation.note && text.length > 0) {
            const characters = Array.from(text);
            return characters[0].toUpperCase() + characters.slice(1).join('');
        }
        else {
            return text;
        }
    }
    /**
     * A line break in the text is written as a space, so that it doesn't start a new step.
     * The exception is a note: each line of a note becomes its own comment line.
     */
    toString(config = Config_1.Config._default) {
        if (this.variation === _Variation.note) {
            return this._capitalize(this.text)
                .split(gherkin_1.lineBreak)
                .map(line => this._line(config, line))
                .join(config.endOfLineChar);
        }
        return this._line(config, (0, gherkin_1.singleLine)(this.text));
    }
    _line(config, content) {
        return this.keywordPrefix(config) +
            this.spaces(config) +
            this._keyword(config) +
            this.keywordSuffix(config) +
            ' ' +
            this.prefix(config) +
            content +
            this.suffix(config);
    }
}
exports.Term = Term;
class CodeTerm extends _BaseTerm {
    constructor(bdd, codeRun) {
        super(bdd);
        this.codeRun = codeRun;
    }
}
exports.CodeTerm = CodeTerm;
class BDD {
    constructor(feature, isBackground = false) {
        this.feature = feature;
        this.isBackground = isBackground;
        this.terms = [];
        this._timeout = undefined;
        this._skip = false;
        this._only = false;
        this.codeRuns = [];
        this.passed = [];
        this._executions = [];
    }
    /**
     * Each run of this BDD, recorded while it runs: one for each example row, and one
     * for each retry. Each has the result, duration and error of each code block.
     * See [BddExecution].
     */
    get executions() {
        return [...this._executions];
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
        var _a, _b;
        return (count === null) ? null : ((_b = (_a = this.example()) === null || _a === void 0 ? void 0 : _a.rows[count]) !== null && _b !== void 0 ? _b : null);
    }
    numberOfExamples() {
        const example = this.example();
        return example ? example.rows.length : 0;
    }
    /**
     * Adds an example row. A BDD has a single `Examples` block, so the row is added
     * to the existing block, or a new block is created if there is none yet.
     */
    addExampleValues(values) {
        if (values.length === 0)
            throw new BddError_1.BddError('Examples require at least one value.');
        const existing = this.example();
        if (existing)
            return existing._addRow(values);
        return new Example(this, values);
    }
    get skip() {
        this._skip = true;
        return this;
    }
    /**
     * Runs only this BDD while you work on it, like `test.only` in Jest.
     * The other BDDs in the same test file are skipped, unless they are also marked with `.only`.
     *
     * @deprecated Not really deprecated. It's marked like this only as a reminder
     * to remove the `.only` before committing your code.
     */
    get only() {
        this._only = true;
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
    toString(config = Config_1.Config._default, withFeature = false) {
        var _a, _b, _c;
        const featureString = withFeature ? (_b = (_a = this.feature) === null || _a === void 0 ? void 0 : _a.toString(config)) !== null && _b !== void 0 ? _b : '' : '';
        const backgroundString = withFeature && ((_c = this.feature) === null || _c === void 0 ? void 0 : _c.hasBackground)
            ? config.endOfLineChar + this.feature.background.toString(config)
            : '';
        const termsString = this.toMap(config).join(config.endOfLineChar);
        return featureString + backgroundString + termsString + config.endOfLineChar;
    }
}
exports.BDD = BDD;
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
    /**
     * This keyword indicates the specific action taken by the user or the system.
     * It's the trigger for the behavior that you're specifying. A scenario may start
     * directly with `when`, without a `given` step.
     */
    when(_) {
        return new When(this.bdd, _);
    }
    /**
     * This keyword is used to describe the expected outcome or result.
     * A scenario may start directly with `then`, without `given` or `when` steps.
     */
    then(_) {
        return new Then(this.bdd, _);
    }
    toString(config = Config_1.Config._default) {
        return super.toString(config);
    }
}
class Given extends Term {
    /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
    get isStep() {
        return !this.isNote;
    }
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
        var _a;
        return (_a = this._keywordVariation(config)) !== null && _a !== void 0 ? _a : config.keywords.given;
    }
    keywordPrefix(config) {
        var _a;
        return (_a = this._keywordPrefixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordPrefix.given;
    }
    keywordSuffix(config) {
        var _a;
        return (_a = this._keywordSuffixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordSuffix.given;
    }
    prefix(config) {
        var _a;
        return (_a = this._prefixVariation(config)) !== null && _a !== void 0 ? _a : config.prefix.given;
    }
    suffix(config) {
        var _a;
        return (_a = this._suffixVariation(config)) !== null && _a !== void 0 ? _a : config.suffix.given;
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
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
    toString(config = Config_1.Config._default) {
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
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
}
class When extends Term {
    /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
    get isStep() {
        return !this.isNote;
    }
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
        var _a;
        return (_a = this._keywordVariation(config)) !== null && _a !== void 0 ? _a : config.keywords.when;
    }
    keywordPrefix(config) {
        var _a;
        return (_a = this._keywordPrefixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordPrefix.when;
    }
    keywordSuffix(config) {
        var _a;
        return (_a = this._keywordSuffixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordSuffix.when;
    }
    prefix(config) {
        var _a;
        return (_a = this._prefixVariation(config)) !== null && _a !== void 0 ? _a : config.prefix.when;
    }
    suffix(config) {
        var _a;
        return (_a = this._suffixVariation(config)) !== null && _a !== void 0 ? _a : config.suffix.when;
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
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
    toString(config = Config_1.Config._default) {
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
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
}
class Then extends Term {
    /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
    get isStep() {
        return !this.isNote;
    }
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
        var _a;
        return (_a = this._keywordVariation(config)) !== null && _a !== void 0 ? _a : config.keywords.then;
    }
    keywordPrefix(config) {
        var _a;
        return (_a = this._keywordPrefixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordPrefix.then;
    }
    keywordSuffix(config) {
        var _a;
        return (_a = this._keywordSuffixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordSuffix.then;
    }
    prefix(config) {
        var _a;
        return (_a = this._prefixVariation(config)) !== null && _a !== void 0 ? _a : config.prefix.then;
    }
    suffix(config) {
        var _a;
        return (_a = this._suffixVariation(config)) !== null && _a !== void 0 ? _a : config.suffix.then;
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
        return this.bdd.addExampleValues(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
    }
    code(code) {
        return new _ThenCode(this.bdd, code);
    }
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
    testRun(code, reporter) {
        BddRunner_1.BddRunner.testRun(this.bdd, code, reporter);
        return this.bdd;
    }
    toString(config = Config_1.Config._default) {
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
        return this.bdd.addExampleValues(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
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
    code(code) {
        return new _ThenCode(this.bdd, code);
    }
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
    testRun(code, reporter) {
        BddRunner_1.BddRunner.testRun(this.bdd, code, reporter);
        return this.bdd;
    }
}
class TableTerm extends Term {
    constructor(bdd, tableName) {
        super(bdd, '', _Variation.term);
        this.rows = [];
        this.tableName = tableName;
    }
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
    /**
     * Here we have something like:
     * [
     * { (number;123), (password;ABC) }
     * { (number;456), (password;XYZ) }
     * ]
     */
    formatTable(config) {
        const sizes = {};
        for (const _row of this.rows) {
            for (const value of _row.values) {
                const maxValue1 = sizes[value.name];
                const maxValue2 = Math.max((0, gherkin_1.escapeCell)(value.name).length, (0, gherkin_1.escapeCell)(value.toString(config)).length);
                const maxValue = (maxValue1 === undefined) ? maxValue2 : Math.max(maxValue1, maxValue2);
                sizes[value.name] = maxValue;
            }
        }
        const spaces = config.spaces;
        const space = config.space;
        const endOfLineChar = config.endOfLineChar;
        const tableDivider = config.tableDivider;
        const rightAlignPadding = spaces +
            spaces +
            spaces +
            ((config.rightAlignKeywords) ? config.padChar.repeat(4) : '');
        const header = rightAlignPadding +
            `${tableDivider}${space}` +
            this.rows[0].values.map(value => {
                var _a;
                const length = (_a = sizes[value.name]) !== null && _a !== void 0 ? _a : 50;
                return (0, gherkin_1.escapeCell)(value.name).padEnd(length, space);
            }).join(`${space}${tableDivider}${space}`) +
            `${space}${tableDivider}`;
        const rowsStr = this.rows.map(row => {
            return rightAlignPadding +
                `${tableDivider}${space}` +
                row.values.map(value => {
                    var _a;
                    const length = (_a = sizes[value.name]) !== null && _a !== void 0 ? _a : 50;
                    return (0, gherkin_1.escapeCell)(value.toString(config)).padEnd(length, space);
                }).join(`${space}${tableDivider}${space}`) +
                `${space}${tableDivider}`;
        });
        const result = `${header}${endOfLineChar}` +
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
    toString(config = Config_1.Config._default) {
        return this.keywordPrefix(config) +
            this.keyword(config) +
            this.keywordSuffix(config) +
            this.prefix(config) +
            this.formatTable(config) +
            this.suffix(config);
    }
}
exports.TableTerm = TableTerm;
class Example extends Term {
    /** Creates the `Examples` block, with its first row. Use `bdd.addExampleValues()` instead. */
    constructor(bdd, values) {
        super(bdd, '', _Variation.term);
        // Rows is an array of Set objects containing values.
        this.rows = [];
        this.rows.push(new Set(values));
    }
    /** @internal */
    _addRow(values) {
        this.rows.push(new Set(values));
        return this;
    }
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
    /**
     * Here we have something like:
     * [
     * { (number;123), (password;ABC) }
     * { (number;456), (password;XYZ) }
     * ]
     */
    formatExampleTable(config) {
        const sizes = {};
        this.rows.forEach(row => {
            row.forEach(value => {
                const maxValue1 = sizes[value.name];
                const maxValue2 = Math.max((0, gherkin_1.escapeCell)(value.name).length, (0, gherkin_1.escapeCell)(value.toString(config)).length);
                const maxValue = (maxValue1 === undefined) ? maxValue2 : Math.max(maxValue1, maxValue2);
                sizes[value.name] = maxValue;
            });
        });
        const { spaces, space, endOfLineChar, tableDivider, padChar, rightAlignKeywords } = config;
        const rightAlignPadding = spaces + spaces + spaces + (rightAlignKeywords ? padChar.repeat(4) : '');
        const header = rightAlignPadding + tableDivider + space +
            Array.from(this.rows.values().next().value).map((value) => {
                var _a;
                const length = (_a = sizes[value.name]) !== null && _a !== void 0 ? _a : 50;
                return (0, gherkin_1.escapeCell)(value.name).padEnd(length, space);
            }).join(space + tableDivider + space) + space + tableDivider;
        const rowsStr = this.rows.map((row) => {
            return rightAlignPadding + tableDivider + space +
                Array.from(row).map((value) => {
                    var _a;
                    const length = (_a = sizes[value.name]) !== null && _a !== void 0 ? _a : 50;
                    return (0, gherkin_1.escapeCell)(value.toString(config)).padEnd(length, space);
                }).join(space + tableDivider + space) + space + tableDivider;
        });
        return header + endOfLineChar + rowsStr.join(endOfLineChar);
    }
    spaces(config) {
        return config.spaces + config.spaces;
    }
    keyword(config) {
        var _a;
        return (_a = this._keywordVariation(config)) !== null && _a !== void 0 ? _a : config.keywords.examples;
    }
    keywordPrefix(config) {
        var _a;
        return (_a = this._keywordPrefixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordPrefix.examples;
    }
    keywordSuffix(config) {
        var _a;
        return (_a = this._keywordSuffixVariation(config)) !== null && _a !== void 0 ? _a : config.keywordSuffix.examples;
    }
    prefix(config) {
        var _a;
        return (_a = this._prefixVariation(config)) !== null && _a !== void 0 ? _a : config.prefix.examples;
    }
    suffix(config) {
        var _a;
        return (_a = this._suffixVariation(config)) !== null && _a !== void 0 ? _a : config.suffix.examples;
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
        return this._addRow(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
    }
    // Visible for testing.
    testRun(code, reporter) {
        BddRunner_1.BddRunner.testRun(this.bdd, code, reporter);
        return this.bdd;
    }
    // Examples have a special toString treatment.
    toString(config = Config_1.Config._default) {
        return this.keywordPrefix(config) +
            this.spaces(config) +
            this._keyword(config) +
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
    toString(config = Config_1.Config._default) {
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
    toString(config = Config_1.Config._default) {
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
        return this.bdd.addExampleValues(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
    }
    code(code) {
        return new _ThenCode(this.bdd, code);
    }
    toString(config = Config_1.Config._default) {
        return super.toString(config);
    }
    run(code) {
        BddRunner_1.BddRunner.run(this.bdd, code);
    }
    testRun(code, reporter) {
        BddRunner_1.BddRunner.testRun(this.bdd, code, reporter);
        return this.bdd;
    }
}
/** The values that are not `undefined` or `null`. */
function _values(...values) {
    return values.filter((v) => v !== undefined && v !== null);
}
/**
 * The Background of a feature: steps that are common to all its scenarios.
 * Get it with `feature.background`.
 *
 * In the feature file the Background is written once, before the scenarios.
 * Its code (added with `.code()`) runs before the code of each scenario of the
 * feature, and before each example row.
 */
class Background {
    constructor(bdd) {
        this.bdd = bdd;
    }
    /**
     * This keyword starts a step that sets up the initial context of the
     * scenarios. For example, "Given I am logged into the website".
     */
    given(_) {
        return new Given(this.bdd, _);
    }
    /**
     * Often used informally in comments within a Gherkin document to provide
     * additional information, clarifications, or explanations about the steps.
     */
    note(_) {
        return new Given(this.bdd, _, _Variation.note);
    }
    toString(config = Config_1.Config._default) {
        let result = config.spaces +
            config.keywordPrefix.background +
            config.keywords.background +
            config.keywordSuffix.background +
            config.endOfLineChar;
        for (const term of Array.from(this.bdd.textTerms)) {
            result += term.toString(config) + config.endOfLineChar;
        }
        return result;
    }
}
exports.Background = Background;
