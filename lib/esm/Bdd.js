/* eslint-disable @typescript-eslint/no-shadow */
// noinspection JSUnusedGlobalSymbols,UnnecessaryLocalVariableJS,DuplicatedCode
import { afterAll, test } from '@jest/globals';
class BddError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
    }
}
class Context {
    example;
    _table;
    constructor(example, _table) {
        this.example = example;
        this._table = _table;
    }
    table(tableName) {
        return new TableRows(this._table.row(tableName));
    }
}
class TableRows {
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
class MultipleTableValues {
    _tables;
    constructor(tables) {
        this._tables = tables;
    }
    static from(tableTerms) {
        let _tables = new Map();
        tableTerms.forEach((_table) => {
            let tableValues = _table.rows.map((r) => TableValues.from(r.values));
            _tables.set(_table.tableName, tableValues);
        });
        return new MultipleTableValues(_tables);
    }
    row(tableName) {
        const table = this._tables.get(tableName);
        if (table === undefined)
            throw new BddError(`There is no table named "${tableName}".`);
        return table;
    }
    toString() {
        let str = '';
        this._tables.forEach((value, key) => {
            str += `${key}: ${JSON.stringify(value)}, `;
        });
        return str;
    }
}
export class TableValues {
    _map;
    constructor(map) {
        this._map = map;
    }
    static from(exampleRow) {
        let _map = new Map();
        exampleRow = exampleRow || [];
        // TODO: REMOVE:
        // for (const _val of exampleRow) {
        //     _map.set(_val.name, _val.value);
        // }
        for (const _val of Array.from(exampleRow)) {
            _map.set(_val.name, _val.value);
        }
        return new TableValues(_map);
    }
    val(name) {
        return this._map.get(name) ?? null;
    }
    toString() {
        return this._map.toString();
    }
}
export function Bdd(feature) {
    return new BDD(feature);
}
export function row(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16) {
    return new Row(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16);
}
class Row {
    values;
    constructor(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16) {
        const values = [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16];
        this.values = values.filter((v) => v !== undefined && v !== null);
    }
}
export function val(name, _) {
    return new Val(name, _);
}
class Val {
    name;
    value;
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    /**
     * These 3 steps will be applied to format a value in Examples and Tables:
     *
     * 1) If a [Config.transformDescribe] was provided, it will be used to format the value.
     *
     * 2) Next, if the value implements the [BddDescribe] interface, or if it has a
     * [describe] method, it will be used to format the value.
     *
     * 3) Last, we'll call the value's [toString] method.
     */
    toString(config = Config._default) {
        let _value = this.value;
        // 1)
        if (config.transformDescribe) {
            _value = config.transformDescribe(this.value) || _value;
        }
        // 2)
        if (_value.describe) {
            let description = _value.describe();
            return (description === null) ? 'NULL' : description.toString();
        }
        // 3)
        else
            return (_value === null) ? 'NULL' : _value.toString();
    }
}
class Keywords {
    feature;
    scenario;
    scenarioOutline;
    given;
    when;
    then;
    and;
    but;
    comment;
    examples;
    table;
    static empty = new Keywords({
        feature: '',
        scenario: '',
        scenarioOutline: '',
        given: '',
        when: '',
        then: '',
        and: '',
        but: '',
        comment: '',
        examples: '',
        table: '',
    });
    constructor({ feature = 'Feature:', scenario = 'Scenario:', scenarioOutline = 'Scenario Outline:', given = 'Given', when = 'When', then = 'Then', and = 'And', but = 'But', comment = '#', examples = 'Examples:', table = '', }) {
        this.feature = feature;
        this.scenario = scenario;
        this.scenarioOutline = scenarioOutline;
        this.given = given;
        this.when = when;
        this.then = then;
        this.and = and;
        this.but = but;
        this.comment = comment;
        this.examples = examples;
        this.table = table;
    }
}
class Config {
    /** The keywords themselves. */
    keywords;
    /**
     * The [prefix] is after the keywords and before the term.
     * The [suffix] is after the term.
     */
    prefix;
    suffix;
    /**
     * The [keywordPrefix] is before the keyword.
     * The [keywordSuffix] is after the keyword.
     */
    keywordPrefix;
    keywordSuffix;
    indent;
    rightAlignKeywords;
    padChar;
    endOfLineChar;
    tableDivider;
    space;
    /**
     * In tables and examples the output of values to feature files is done with toString().
     * However, this can be overridden here for your business classes.
     * Note: If you return `null` the values won't be changed.
     *
     * Example:
     * ```
     * Object? transformDescribe(Object? obj) {
     *   if (obj is User) return obj.userName;
     * }
     * ```
     */
    transformDescribe;
    static _default = new Config({});
    constructor({ keywords = new Keywords({}), prefix = Keywords.empty, suffix = Keywords.empty, keywordPrefix = Keywords.empty, keywordSuffix = Keywords.empty, indent = 2, rightAlignKeywords = false, padChar = ' ', endOfLineChar = '\n', tableDivider = '|', space = ' ', transformDescribe = null, }) {
        this.keywords = keywords;
        this.prefix = prefix;
        this.suffix = suffix;
        this.keywordPrefix = keywordPrefix;
        this.keywordSuffix = keywordSuffix;
        this.indent = indent;
        this.rightAlignKeywords = rightAlignKeywords;
        this.padChar = padChar;
        this.endOfLineChar = endOfLineChar;
        this.tableDivider = tableDivider;
        this.space = space;
        this.transformDescribe = transformDescribe;
    }
    get spaces() {
        return this.padChar.repeat(this.indent);
    }
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
class Term extends _BaseTerm {
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
class BDD {
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
class TableTerm extends Term {
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
export class TestResult {
    _bdd;
    constructor(bdd) {
        this._bdd = bdd;
    }
    get terms() {
        return this._bdd.textTerms;
    }
    toMap(config = Config._default) {
        return this._bdd.toMap(config);
    }
    toString(config = Config._default) {
        return this._bdd.toString(config);
    }
    get wasSkipped() {
        return this._bdd._skip;
    }
    /**
     * Empty means the test was not run yet.
     * If the Bdd has no examples, the result will be a single value.
     * Otherwise, it will have one result for each example.
     *
     * For each value:
     * True values means it passed.
     * False values means it did not pass.
     */
    get passed() {
        return this._bdd.passed;
    }
}
export class Feature {
    title;
    description;
    _bdds;
    constructor(title, description) {
        this.title = title;
        this.description = description;
        this._bdds = [];
    }
    get bdds() {
        return [...this._bdds];
    }
    get isEmpty() {
        return this.title.length === 0;
    }
    get isNotEmpty() {
        return this.title.length > 0;
    }
    get testResults() {
        return this._bdds.map(bdd => new TestResult(bdd));
    }
    add(bdd) {
        this._bdds.push(bdd);
    }
    toString(config = Config._default) {
        let result = config.keywordPrefix.feature +
            config.keywords.feature +
            config.keywordSuffix.feature +
            ' ' +
            config.prefix.feature +
            this.title +
            config.suffix.feature +
            config.endOfLineChar;
        if (this.description) {
            const parts = this.description.trim().split('\n');
            result += config.spaces +
                config.prefix.feature +
                parts.join(config.endOfLineChar + config.spaces) +
                config.suffix.feature +
                config.endOfLineChar;
        }
        return result;
    }
}
class _RunInfo {
    totalTestCount = 0;
    testCount = 0;
    skipCount = 0;
    passedCount = 0;
    failedCount = 0;
}
export function reporter(r1, r2, r3, r4, r5) {
    BddReporter.set(r1, r2, r3, r4, r5);
}
/**
 * Example:
 *
 * ```
 * void main() async {
 *   BddReporter.set(ConsoleReporter(), FeatureFileReporter());
 *   group('favorites_test', favorites_test.main);
 *   group('search_test', search_test.main);
 *   await BddReporter.reportAll();
 * }
 * ```
 */
export class BddReporter {
    static runInfo = new _RunInfo();
    static _emptyFeature = new Feature('');
    static _reporters = [];
    static yellow = '\x1B[38;5;226m';
    static reset = '\u001b[0m';
    // Static method to set reporters.
    static set(r1, r2, r3, r4, r5) {
        BddReporter._reporters = [r1, r2, r3, r4, r5].filter(_reporter => _reporter !== undefined);
        BddReporter._reportAll();
    }
    static _reportAll() {
        afterAll(async () => {
            // TODO: Move this to a Jest Custom Reporter?
            // console.log(
            //   `${this.yellow}\n` +
            //   'RESULTS ════════════════════════════════════════════════\n' +
            //   `TOTAL: ${this.runInfo.totalTestCount} tests (${this.runInfo.testCount} BDDs)\n` +
            //   `PASSED: ${this.runInfo.passedCount} tests\n` +
            //   `FAILED: ${this.runInfo.failedCount} tests\n` +
            //   `SKIPPED: ${this.runInfo.skipCount} tests\n` +
            //   `══════════════════════════════════════════════════════${this.reset}\n\n`,
            // );
            for (const _reporter of this._reporters) {
                // TODO: Move this to a Jest Custom Reporter?
                // console.log(`Running the ${_reporter.constructor.name}...\n`);
                await _reporter.report();
            }
        });
    }
    features = new Set();
    _addBdd(bdd) {
        // Use the feature, if provided. Otherwise, use the "empty feature".
        let _feature = bdd.feature ?? BddReporter._emptyFeature;
        // We must find out if we already have a feature with the given title.
        // If we do, use the one we already have.
        let feature = Array.from(this.features).find(f => f.title === _feature.title);
        // If we don't, use the new one provided, and put it in the features set.
        if (feature === undefined) {
            feature = _feature;
            this.features.add(feature);
        }
        // Add the bdd to the feature.
        feature.add(bdd);
    }
    /** Keeps A-Z 0-9, make it lowercase, and change spaces into underline. */
    normalizeFileName(name) {
        return name.trim().split('').map(char => {
            if (char === ' ')
                return '_';
            if (!/[A-Za-z0-9]/.test(char))
                return '';
            return char.toLowerCase();
        }).join('');
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
                console.log((currentExecution === 1)
                    ? `\n${this._header(bdd._skip, _testCountStr)}${_Run.blue}${bddStr}${_Run.boldOff}`
                    : `\n${_Run.red}Retry ${currentExecution}.\n${_Run.boldOff}`);
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
/** This is for testing the BDD framework only. */
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
