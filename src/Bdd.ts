// noinspection JSUnusedGlobalSymbols,UnnecessaryLocalVariableJS,DuplicatedCode

import type { Feature } from './Feature';
import { Row } from './row';
import { Val } from './val';
import type { Context } from './Context';
import type { BddReporter } from './BddReporter';
import { Config } from './Config';
import { BddError } from './BddError';
import { BddRunner } from './BddRunner';
import type { BddExecution } from './BddExecution';
import { escapeCell, lineBreak, singleLine } from './gherkin';

export function Bdd(feature?: Feature): BDD {
  return new BDD(feature);
}

abstract class _BaseTerm {
  bdd: BDD;

  protected constructor(bdd: BDD) {
    this.bdd = bdd;
    bdd.terms.push(this);
  }
}

enum _Variation {
  term,
  and,
  but,
  note,
}

export abstract class Term extends _BaseTerm {
  readonly text: string;
  readonly variation: _Variation;

  protected constructor(bdd: BDD, text: string, variation: _Variation) {
    super(bdd);
    this.text = text;
    this.variation = variation;
  }

  abstract spaces(config: Config): string;

  abstract keyword(config: Config): string;

  abstract keywordPrefix(config: Config): string;

  abstract keywordSuffix(config: Config): string;

  abstract prefix(config: Config): string;

  abstract suffix(config: Config): string;

  protected _keywordVariation(config: Config): string | null {
    return (this.variation === _Variation.and)
      ? config.keywords.and
      : (this.variation === _Variation.but)
        ? config.keywords.but
        : (this.variation === _Variation.note)
          ? config.keywords.comment
          : null;
  }

  protected _keywordPrefixVariation(config: Config): string | null {
    return (this.variation === _Variation.and)
      ? config.keywordPrefix.and
      : (this.variation === _Variation.but)
        ? config.keywordPrefix.but
        : (this.variation === _Variation.note)
          ? config.keywordPrefix.comment
          : null;
  }

  protected _keywordSuffixVariation(config: Config): string | null {
    return (this.variation === _Variation.and)
      ? config.keywordSuffix.and
      : (this.variation === _Variation.but)
        ? config.keywordSuffix.but
        : (this.variation === _Variation.note)
          ? config.keywordSuffix.comment
          : null;
  }

  protected _prefixVariation(config: Config): string | null {
    return (this.variation === _Variation.and)
      ? config.prefix.and
      : (this.variation === _Variation.but)
        ? config.prefix.but
        : (this.variation === _Variation.note)
          ? config.prefix.comment
          : null;
  }

  protected _suffixVariation(config: Config): string | null {
    return (this.variation === _Variation.and)
      ? config.suffix.and
      : (this.variation === _Variation.but)
        ? config.suffix.but
        : (this.variation === _Variation.note)
          ? config.suffix.comment
          : null;
  }

  protected _padSize(config: Config): number {
    return Math.max(
      Math.max(
        Math.max(
          Math.max(config.keywords.given.length, config.keywords.then.length),
          config.keywords.when.length,
        ),
        config.keywords.and.length,
      ),
      config.keywords.but.length,
    );
  }

  protected _keyword(config: Config = Config._default): string {
    const term = this.keyword(config);
    let result = this._keyword_unpadded(term, config);
    if (config.rightAlignKeywords) {
      const padSize = this._padSize(config);
      result = result.padStart(padSize, config.padChar);
    }
    return result;
  }

  protected _keyword_unpadded(term: string, config: Config): string {
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

  /** Whether this term is a note, added with `.note()`. */
  get isNote(): boolean {
    return this.variation === _Variation.note;
  }

  /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
  get isStep(): boolean {
    return false;
  }

  protected _capitalize(text: string): string {
    if (this.variation === _Variation.note && text.length > 0) {
      const characters = Array.from(text);
      return characters[0].toUpperCase() + characters.slice(1).join('');
    } else {
      return text;
    }
  }

  /**
   * A line break in the text is written as a space, so that it doesn't start a new step.
   * The exception is a note: each line of a note becomes its own comment line.
   */
  toString(config: Config = Config._default): string {
    if (this.variation === _Variation.note) {
      return this._capitalize(this.text)
        .split(lineBreak)
        .map(line => this._line(config, line))
        .join(config.endOfLineChar);
    }
    return this._line(config, singleLine(this.text));
  }

  protected _line(config: Config, content: string): string {
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

export abstract class CodeTerm extends _BaseTerm {
  codeRun: CodeRun;

  protected constructor(bdd: BDD, codeRun: CodeRun) {
    super(bdd);
    this.codeRun = codeRun;
  }
}

export class BDD {
  feature?: Feature;
  terms: _BaseTerm[];
  _timeout?: number;
  _skip: boolean;
  _only: boolean;

  /** True if this BDD holds the Background steps of a feature (see `Feature.background`). */
  readonly isBackground: boolean;

  /** The callbacks given to `.run()`. They belong to no step. */
  codeRuns: CodeRun[];

  /** @internal */
  readonly _executions: BddExecution[];

  /**
   * Nulls means the test was not run yet.
   * True means it passed.
   * False means it did not pass.
   */
  passed: boolean[];

  constructor(feature?: Feature, isBackground: boolean = false) {
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
  get executions(): BddExecution[] {
    return [...this._executions];
  }

  addCode(code: CodeRun): void {
    this.codeRuns.push(code);
  }

  /** Example: `List<Given> = bdd.allTerms<Given>().toList();` */
  allTerms<T extends Term>(type: { new(...args: any[]): T }): Iterable<T> {
    return this.terms.filter(term => term instanceof type) as Iterable<T>;
  }

  /** The BDD description is its Scenario (or blank if there is no Scenario). */
  description(): string {
    const scenarioIterator = this.allTerms<Scenario>(Scenario)[Symbol.iterator]();
    const scenario = scenarioIterator.next().value;
    return scenario ? scenario.text : '';
  }

  /** A Bdd may have 0 or 1 examples. */
  example(): Example | undefined {
    const exampleIterator = this.allTerms<Example>(Example)[Symbol.iterator]();
    return exampleIterator.next().value;
  }

  /** A Bdd may have 0, 1, or more tables (which are not examples). */
  tables(): TableTerm[] {
    return Array.from(this.allTerms<TableTerm>(TableTerm));
  }

  /** The example, if it exists, may have any number of rows. */
  exampleRow(count: number | null): Set<Val> | null {
    return (count === null) ? null : (this.example()?.rows[count] ?? null);
  }

  numberOfExamples(): number {
    const example = this.example();
    return example ? example.rows.length : 0;
  }

  /**
   * Adds an example row. A BDD has a single `Examples` block, so the row is added
   * to the existing block, or a new block is created if there is none yet.
   */
  addExampleValues(values: Val[]): Example {
    if (values.length === 0) throw new BddError('Examples require at least one value.');
    const existing = this.example();
    if (existing) return existing._addRow(values);
    return new Example(this, values);
  }

  get skip(): BDD {
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
  get only(): BDD {
    this._only = true;
    return this;
  }

  /** Timeout in milliseconds */
  timeout(duration?: number): BDD {
    this._timeout = duration;
    return this;
  }

  /** Timeout in seconds */
  timeoutSec(seconds: number): BDD {
    return this.timeout(seconds * 1000); // Convert seconds to milliseconds
  }

  /**
   * The high-level description of a test case in Gherkin. It describes a
   * particular functionality or feature of the system being tested.
   */
  scenario(text: string): Scenario {
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
  given(_: string): Given {
    return new Given(this, _);
  }

  get textTerms(): Iterable<Term> {
    return this.terms.filter(term => term instanceof Term) as Iterable<Term>;
  }

  get codeTerms(): Iterable<CodeTerm> {
    return this.terms.filter(term => term instanceof CodeTerm) as Iterable<CodeTerm>;
  }

  toMap(config: Config): string[] {
    return Array.from(this.textTerms).map(term => term.toString(config));
  }

  toString(config: Config = Config._default, withFeature: boolean = false): string {
    const featureString = withFeature ? this.feature?.toString(config) ?? '' : '';
    const backgroundString = withFeature && this.feature?.hasBackground
      ? config.endOfLineChar + this.feature.background.toString(config)
      : '';
    const termsString = this.toMap(config).join(config.endOfLineChar);
    return featureString + backgroundString + termsString + config.endOfLineChar;
  }
}

class Scenario extends Term {
  constructor(bdd: BDD, text: string) {
    super(bdd, text, _Variation.term);
  }

  get containsExample(): boolean {
    return this.bdd.terms.some((term) => term instanceof Example);
  }

  spaces(config: Config): string {
    return config.spaces;
  }

  keyword(config: Config): string {
    return this.containsExample
      ? config.keywords.scenarioOutline
      : config.keywords.scenario;
  }

  keywordPrefix(config: Config): string {
    return this.containsExample
      ? config.keywordPrefix.scenarioOutline
      : config.keywordPrefix.scenario;
  }

  keywordSuffix(config: Config): string {
    return this.containsExample
      ? config.keywordSuffix.scenarioOutline
      : config.keywordSuffix.scenario;
  }

  prefix(config: Config): string {
    return this.containsExample
      ? config.prefix.scenarioOutline
      : config.prefix.scenario;
  }

  suffix(config: Config): string {
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
  given(_: string): Given {
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
  note(_: string): Given {
    return new Given(this.bdd, _, _Variation.note);
  }

  /**
   * This keyword indicates the specific action taken by the user or the system.
   * It's the trigger for the behavior that you're specifying. A scenario may start
   * directly with `when`, without a `given` step.
   */
  when(_: string): When {
    return new When(this.bdd, _);
  }

  /**
   * This keyword is used to describe the expected outcome or result.
   * A scenario may start directly with `then`, without `given` or `when` steps.
   */
  then(_: string): Then {
    return new Then(this.bdd, _);
  }

  toString(config: Config = Config._default): string {
    return super.toString(config);
  }
}

class Given extends Term {
  /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
  get isStep(): boolean {
    return !this.isNote;
  }

  constructor(bdd: BDD, text: string, variation: _Variation = _Variation.term) {
    super(bdd, text, variation);
  }

  static _internal(bdd: BDD, text: string, variation: _Variation): Given {
    return new Given(bdd, text, variation);
  }

  spaces(config: Config): string {
    return config.spaces + config.spaces;
  }

  keyword(config: Config): string {
    return this._keywordVariation(config) ?? config.keywords.given;
  }

  keywordPrefix(config: Config): string {
    return this._keywordPrefixVariation(config) ?? config.keywordPrefix.given;
  }

  keywordSuffix(config: Config): string {
    return this._keywordSuffixVariation(config) ?? config.keywordSuffix.given;
  }

  prefix(config: Config): string {
    return this._prefixVariation(config) ?? config.prefix.given;
  }

  suffix(config: Config): string {
    return this._suffixVariation(config) ?? config.suffix.given;
  }

  /**
   * A table must have a name and rows. The name is necessary if you want to
   * read the values from it later (if not, just pass an empty string).
   * Example: `ctx.table('notifications').row(0).val('read') as bool`.
   */
  table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row): GivenTable {
    return new GivenTable(this.bdd, tableName, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): Given {
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
  but(_: string): Given {
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
  note(_: string): Given {
    return Given._internal(this.bdd, _, _Variation.note);
  }

  /**
   * This keyword indicates the specific action taken by the user or the system.
   * It's the trigger for the behavior that you're specifying. For instance,
   * "When I click the 'Submit' button" describes the action taken after the
   * initial context is set by the 'Given' step.
   */
  when(_: string): When {
    return new When(this.bdd, _);
  }

  /**
   * This keyword is used to describe the expected outcome or result after the
   * 'When' step is executed. It's used to assert that a certain outcome should
   * occur, which helps to validate whether the system behaves as expected.
   * An example is, "Then I should be redirected to the dashboard".
   */
  then(_: string): Then {
    return new Then(this.bdd, _);
  }

  code(code: CodeRun): _GivenCode {
    return new _GivenCode(this.bdd, code);
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }

  toString(config: Config = Config._default): string {
    return super.toString(config);
  }
}

class _GivenCode extends CodeTerm {

  constructor(bdd: BDD, code: CodeRun) {
    super(bdd, code);
  }

  /**
   * A table must have a name and rows. The name is necessary if you want to
   * read the values from it later (if not, just pass an empty string).
   * Example: `ctx.table('notifications').row(0).val('read') as bool`.
   */
  table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): GivenTable {
    return new GivenTable(this.bdd, tableName, row1, row2, row3, row4);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): Given {
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
  but(_: string): Given {
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
  note(_: string): Given {
    return Given._internal(this.bdd, _, _Variation.note);
  }

  /**
   * This keyword indicates the specific action taken by the user or the system.
   * It's the trigger for the behavior that you're specifying. For instance,
   * "When I click the 'Submit' button" describes the action taken after the
   * initial context is set by the 'Given' step.
   */
  when(_: string): When {
    return new When(this.bdd, _);
  }

  /**
   * This keyword is used to describe the expected outcome or result after the
   * 'When' step is executed. It's used to assert that a certain outcome should
   * occur, which helps to validate whether the system behaves as expected.
   * An example is, "Then I should be redirected to the dashboard".
   */
  then(_: string): Then {
    return new Then(this.bdd, _);
  }

  code(code: CodeRun): _GivenCode {
    return new _GivenCode(this.bdd, code);
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }
}

class When extends Term {
  /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
  get isStep(): boolean {
    return !this.isNote;
  }

  constructor(bdd: BDD, text: string, variation: _Variation = _Variation.term) {
    super(bdd, text, variation);
  }

  static _internal(bdd: BDD, text: string, variation: _Variation): When {
    return new When(bdd, text, variation);
  }

  spaces(config: Config): string {
    return config.spaces + config.spaces;
  }

  keyword(config: Config): string {
    return this._keywordVariation(config) ?? config.keywords.when;
  }

  keywordPrefix(config: Config): string {
    return this._keywordPrefixVariation(config) ?? config.keywordPrefix.when;
  }

  keywordSuffix(config: Config): string {
    return this._keywordSuffixVariation(config) ?? config.keywordSuffix.when;
  }

  prefix(config: Config): string {
    return this._prefixVariation(config) ?? config.prefix.when;
  }

  suffix(config: Config): string {
    return this._suffixVariation(config) ?? config.suffix.when;
  }

  /**
   * A table must have a name and rows. The name is necessary if you want to
   * read the values from it later (if not, just pass an empty string).
   * Example: `ctx.table('notifications').row(0).val('read') as bool`.
   */
  table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): WhenTable {
    return new WhenTable(this.bdd, tableName, row1, row2, row3, row4);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): When {
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
  but(_: string): When {
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
  note(_: string): When {
    return When._internal(this.bdd, _, _Variation.note);
  }

  /**
   * This keyword is used to describe the expected outcome or result after the
   * 'When' step is executed. It's used to assert that a certain outcome should
   * occur, which helps to validate whether the system behaves as expected.
   * An example is, "Then I should be redirected to the dashboard".
   */
  then(_: string): Then {
    return new Then(this.bdd, _);
  }

  code(code: CodeRun): _WhenCode {
    return new _WhenCode(this.bdd, code);
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }

  toString(config: Config = Config._default): string {
    return super.toString(config);
  }
}

class _WhenCode extends CodeTerm {
  constructor(bdd: BDD, code: CodeRun) {
    super(bdd, code);
  }

  /**
   * A table must have a name and rows. The name is necessary if you want to
   * read the values from it later (if not, just pass an empty string).
   * Example: `ctx.table('notifications').row(0).val('read') as bool`.
   */
  table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): WhenTable {
    return new WhenTable(this.bdd, tableName, row1, row2, row3, row4);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): When {
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
  but(_: string): When {
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
  note(_: string): When {
    return When._internal(this.bdd, _, _Variation.note);
  }

  /**
   * This keyword is used to describe the expected outcome or result after the
   * 'When' step is executed. It's used to assert that a certain outcome should
   * occur, which helps to validate whether the system behaves as expected.
   * An example is, "Then I should be redirected to the dashboard".
   */
  then(_: string): Then {
    return new Then(this.bdd, _);
  }

  code(code: CodeRun): _WhenCode {
    return new _WhenCode(this.bdd, code);
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }
}

class Then extends Term {
  /** Whether this term is a Gherkin step (Given, When, Then, And or But), and not a note. */
  get isStep(): boolean {
    return !this.isNote;
  }

  constructor(bdd: BDD, text: string, variation: _Variation = _Variation.term) {
    super(bdd, text, variation);
  }

  protected static _internal(bdd: BDD, text: string, variation: _Variation): Then {
    return new Then(bdd, text, variation);
  }

  spaces(config: Config): string {
    return config.spaces + config.spaces;
  }

  keyword(config: Config): string {
    return this._keywordVariation(config) ?? config.keywords.then;
  }

  keywordPrefix(config: Config): string {
    return this._keywordPrefixVariation(config) ?? config.keywordPrefix.then;
  }

  keywordSuffix(config: Config): string {
    return this._keywordSuffixVariation(config) ?? config.keywordSuffix.then;
  }

  prefix(config: Config): string {
    return this._prefixVariation(config) ?? config.prefix.then;
  }

  suffix(config: Config): string {
    return this._suffixVariation(config) ?? config.suffix.then;
  }

  /**
   * A table must have a name and rows. The name is necessary if you want to
   * read the values from it later (if not, just pass an empty string).
   * Example: `ctx.table('notifications').row(0).val('read') as bool`.
   */
  table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): ThenTable {
    return new ThenTable(this.bdd, tableName, row1, row2, row3, row4);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): Then {
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
  but(_: string): Then {
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
  note(_: string): Then {
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
  example(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val): Example {
    return this.bdd.addExampleValues(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
  }

  code(code: CodeRun): _ThenCode {
    return new _ThenCode(this.bdd, code);
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }

  testRun(code: CodeRun, reporter?: BddReporter): BDD {
    BddRunner.testRun(this.bdd, code, reporter);
    return this.bdd;
  }

  toString(config: Config = Config._default): string {
    return super.toString(config);
  }
}

class _ThenCode extends CodeTerm {
  constructor(bdd: BDD, code: CodeRun) {
    super(bdd, code);
  }

  /**
   * A table must have a name and rows. The name is necessary if you want to
   * read the values from it later (if not, just pass an empty string).
   * Example: `ctx.table('notifications').row(0).val('read') as bool`.
   */
  table(tableName: string, row1: Row, row2?: Row, row3?: Row, row4?: Row): ThenTable {
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
  example(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val): Example {
    return this.bdd.addExampleValues(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): Then {
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
  but(_: string): Then {
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
  note(_: string): Then {
    return new Then(this.bdd, _, _Variation.note);
  }

  code(code: CodeRun): _ThenCode {
    return new _ThenCode(this.bdd, code);
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }

  testRun(code: CodeRun, reporter?: BddReporter): BDD {
    BddRunner.testRun(this.bdd, code, reporter);
    return this.bdd;
  }
}

export class TableTerm extends Term {
  tableName: string;
  rows: Row[] = [];

  constructor(bdd: BDD, tableName: string) {
    super(bdd, '', _Variation.term);
    this.tableName = tableName;
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }

  /**
   * Here we have something like:
   * [
   * { (number;123), (password;ABC) }
   * { (number;456), (password;XYZ) }
   * ]
   */
  formatTable(config: Config): string {
    const sizes: { [key: string]: number } = {};
    for (const _row of this.rows) {
      for (const value of _row.values) {
        const maxValue1: number | undefined = sizes[value.name];
        const maxValue2: number = Math.max(escapeCell(value.name).length, escapeCell(value.toString(config)).length);
        const maxValue: number = (maxValue1 === undefined) ? maxValue2 : Math.max(maxValue1, maxValue2);

        sizes[value.name] = maxValue;
      }
    }

    const spaces: string = config.spaces;
    const space: string = config.space;
    const endOfLineChar: string = config.endOfLineChar;
    const tableDivider: string = config.tableDivider;

    const rightAlignPadding: string = spaces +
      spaces +
      spaces +
      ((config.rightAlignKeywords) ? config.padChar.repeat(4) : '');

    const header: string = rightAlignPadding +
      `${tableDivider}${space}` +
      this.rows[0].values.map(value => {
        const length: number = sizes[value.name] ?? 50;
        return escapeCell(value.name).padEnd(length, space);
      }).join(`${space}${tableDivider}${space}`) +
      `${space}${tableDivider}`;

    const rowsStr: string[] = this.rows.map(row => {
      return rightAlignPadding +
        `${tableDivider}${space}` +
        row.values.map(value => {
          const length: number = sizes[value.name] ?? 50;
          return escapeCell(value.toString(config)).padEnd(length, space);
        }).join(`${space}${tableDivider}${space}`) +
        `${space}${tableDivider}`;
    });

    const result: string = `${header}${endOfLineChar}` +
      `${rowsStr.join(endOfLineChar)}`;

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  spaces(config: Config): string {
    return '';
  }

  keyword(config: Config): string {
    return config.keywords.table;
  }

  keywordPrefix(config: Config): string {
    return config.keywordPrefix.table;
  }

  keywordSuffix(config: Config): string {
    return config.keywordSuffix.table;
  }

  prefix(config: Config): string {
    return config.prefix.table;
  }

  suffix(config: Config): string {
    return config.suffix.table;
  }

  toString(config: Config = Config._default): string {
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
  rows: Set<Val>[] = [];

  /** Creates the `Examples` block, with its first row. Use `bdd.addExampleValues()` instead. */
  constructor(bdd: BDD, values: Val[]) {
    super(bdd, '', _Variation.term);
    this.rows.push(new Set(values));
  }

  /** @internal */
  _addRow(values: Val[]): Example {
    this.rows.push(new Set(values));
    return this;
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }

  /**
   * Here we have something like:
   * [
   * { (number;123), (password;ABC) }
   * { (number;456), (password;XYZ) }
   * ]
   */
  formatExampleTable(config: Config): string {
    const sizes: { [key: string]: number } = {};

    this.rows.forEach(row => {
      row.forEach(value => {
        const maxValue1 = sizes[value.name];
        const maxValue2 = Math.max(escapeCell(value.name).length, escapeCell(value.toString(config)).length);
        const maxValue = (maxValue1 === undefined) ? maxValue2 : Math.max(maxValue1, maxValue2);
        sizes[value.name] = maxValue;
      });
    });

    const {spaces, space, endOfLineChar, tableDivider, padChar, rightAlignKeywords} = config;
    const rightAlignPadding = spaces + spaces + spaces + (rightAlignKeywords ? padChar.repeat(4) : '');

    const header = rightAlignPadding + tableDivider + space +
      Array.from(this.rows.values().next().value as Set<Val>).map((value: Val) => {
        const length = sizes[value.name] ?? 50;
        return escapeCell(value.name).padEnd(length, space);
      }).join(space + tableDivider + space) + space + tableDivider;

    const rowsStr = this.rows.map((row) => {
      return rightAlignPadding + tableDivider + space +
        Array.from(row).map((value: Val) => {
          const length = sizes[value.name] ?? 50;
          return escapeCell(value.toString(config)).padEnd(length, space);
        }).join(space + tableDivider + space) + space + tableDivider;
    });

    return header + endOfLineChar + rowsStr.join(endOfLineChar);
  }

  spaces(config: Config): string {
    return config.spaces + config.spaces;
  }

  keyword(config: Config): string {
    return this._keywordVariation(config) ?? config.keywords.examples;
  }

  keywordPrefix(config: Config): string {
    return this._keywordPrefixVariation(config) ?? config.keywordPrefix.examples;
  }

  keywordSuffix(config: Config): string {
    return this._keywordSuffixVariation(config) ?? config.keywordSuffix.examples;
  }

  prefix(config: Config): string {
    return this._prefixVariation(config) ?? config.prefix.examples;
  }

  suffix(config: Config): string {
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
  example(
    v1: Val,
    v2?: Val,
    v3?: Val,
    v4?: Val,
    v5?: Val,
    v6?: Val,
    v7?: Val,
    v8?: Val,
    v9?: Val,
    v10?: Val,
    v11?: Val,
    v12?: Val,
    v13?: Val,
    v14?: Val,
    v15?: Val,
  ): Example {
    return this._addRow(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
  }

  // Visible for testing.
  testRun(code: CodeRun, reporter?: BddReporter): BDD {
    BddRunner.testRun(this.bdd, code, reporter);
    return this.bdd;
  }

  // Examples have a special toString treatment.
  toString(config: Config = Config._default): string {
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
  constructor(
    bdd: BDD,
    tableName: string,
    row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row,
  ) {
    super(bdd, tableName);

    this.rows.push(...[
      row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16,
    ].filter(row => (row !== null) && (row !== undefined)) as Row[]);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): Given {
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
  but(_: string): Given {
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
  note(_: string): Given {
    return new Given(this.bdd, _, _Variation.note);
  }

  /**
   * This keyword indicates the specific action taken by the user or the system.
   * It's the trigger for the behavior that you're specifying. For instance,
   * "When I click the 'Submit' button" describes the action taken after the
   * initial context is set by the 'Given' step.
   */
  when(_: string): When {
    return new When(this.bdd, _);
  }

  code(code: CodeRun): _GivenCode {
    return new _GivenCode(this.bdd, code);
  }

  toString(config: Config = Config._default): string {
    return super.toString(config);
  }
}

class WhenTable extends TableTerm {
  // Constructor with optional parameters
  constructor(
    bdd: BDD,
    tableName: string,
    row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row,
  ) {
    super(bdd, tableName);

    this.rows.push(...[
      row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16,
    ].filter(row => (row !== null) && (row !== undefined)) as Row[]);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): When {
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
  but(_: string): When {
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
  note(_: string): When {
    return When._internal(this.bdd, _, _Variation.note);
  }

  /**
   * This keyword is used to describe the expected outcome or result after the
   * 'When' step is executed. It's used to assert that a certain outcome should
   * occur, which helps to validate whether the system behaves as expected.
   * An example is, "Then I should be redirected to the dashboard".
   */
  then(_: string): Then {
    return new Then(this.bdd, _);
  }

  code(code: CodeRun): _WhenCode {
    return new _WhenCode(this.bdd, code);
  }

  // Overriding the toString method
  toString(config: Config = Config._default): string {
    return super.toString(config);
  }
}

class ThenTable extends TableTerm {

  constructor(
    bdd: BDD,
    tableName: string,
    row1: Row, row2?: Row, row3?: Row, row4?: Row, row5?: Row, row6?: Row, row7?: Row, row8?: Row, row9?: Row, row10?: Row, row11?: Row, row12?: Row, row13?: Row, row14?: Row, row15?: Row, row16?: Row,
  ) {
    super(bdd, tableName);

    this.rows.push(...[
      row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11, row12, row13, row14, row15, row16,
    ].filter(row => (row !== null) && (row !== undefined)) as Row[]);
  }

  /**
   * This keyword is used to extend a 'Given', 'When', or 'Then' step.
   * It allows you to add multiple conditions or actions in the same step
   * without having to repeat the 'Given', 'When', or 'Then' keyword.
   * For example, "And I should see a confirmation message" could follow
   * a 'Then' step to further specify the expected outcomes.
   */
  and(_: string): Then {
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
  but(_: string): Then {
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
  note(_: string): Then {
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
  example(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val, v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val): Example {
    return this.bdd.addExampleValues(_values(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15));
  }

  code(code: CodeRun): _ThenCode {
    return new _ThenCode(this.bdd, code);
  }

  toString(config: Config = Config._default): string {
    return super.toString(config);
  }

  run(code?: CodeRun): void {
    BddRunner.run(this.bdd, code);
  }

  testRun(code: CodeRun, reporter?: BddReporter): BDD {
    BddRunner.testRun(this.bdd, code, reporter);
    return this.bdd;
  }
}


export type CodeRun = ((ctx: Context) => Promise<void> | void) | undefined;

/** The values that are not `undefined` or `null`. */
function _values(...values: (Val | undefined | null)[]): Val[] {
  return values.filter((v): v is Val => v !== undefined && v !== null);
}

/**
 * The Background of a feature: steps that are common to all its scenarios.
 * Get it with `feature.background`.
 *
 * In the feature file the Background is written once, before the scenarios.
 * Its code (added with `.code()`) runs before the code of each scenario of the
 * feature, and before each example row.
 */
export class Background {
  /** The BDD that holds the Background steps. */
  readonly bdd: BDD;

  constructor(bdd: BDD) {
    this.bdd = bdd;
  }

  /**
   * This keyword starts a step that sets up the initial context of the
   * scenarios. For example, "Given I am logged into the website".
   */
  given(_: string): Given {
    return new Given(this.bdd, _);
  }

  /**
   * Often used informally in comments within a Gherkin document to provide
   * additional information, clarifications, or explanations about the steps.
   */
  note(_: string): Given {
    return new Given(this.bdd, _, _Variation.note);
  }

  toString(config: Config = Config._default): string {
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
