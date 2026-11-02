import { Background, BDD } from './Bdd';
import { TestResult } from './TestResult';
import { Config } from './Config';
import { FeatureDescription } from './FeatureDescription';
import { singleLine } from './gherkin';

/**
 * A Gherkin Feature. It has a title, an optional description (plain text or a User Story),
 * an optional [background], and the BDDs (scenarios) created with `Bdd(feature)`.
 */
export class Feature {
  readonly title: string;
  private readonly _description?: FeatureDescription;
  private readonly _bdds: BDD[];
  private _background?: BDD;

  /**
   * Creates a feature with the given [title], and an optional [description].
   * For a User Story description, use [Feature.userStory] instead.
   */
  constructor(title: string, description?: string | FeatureDescription) {
    this.title = title;
    this._description =
      typeof description === 'string' ? FeatureDescription.text(description) : (description ?? undefined);
    this._bdds = [];
  }

  /**
   * Creates a feature with a User Story description. Example:
   *
   * ```
   * const feature = Feature.userStory('User Login', {
   *   asA: 'Registered User',
   *   iWant: 'to log into my account',
   *   soThat: 'I can access my private dashboard',
   * });
   * ```
   */
  static userStory(title: string, userStory: { asA: string; iWant: string; soThat: string }): Feature {
    return new Feature(title, FeatureDescription.userStory(userStory));
  }

  /** The plain text description, if any. */
  get description(): string | undefined {
    return this._description?.text;
  }

  /** The description, which may be plain text or a User Story. */
  get featureDescription(): FeatureDescription | undefined {
    return this._description;
  }

  /**
   * The Background of the feature: steps that are common to all its scenarios.
   * They are written once in the feature, and their code runs before the code of
   * each scenario (and before each example row). Example:
   *
   * ```
   * const feature = new Feature('Buying and Selling Stocks');
   *
   * feature.background
   *   .given('The user has 100,000 dollars in cash-balance.')
   *   .code(() => store.portfolio.cashBalance.setAmount(100000));
   * ```
   */
  get background(): Background {
    this._background ??= new BDD(this, true);
    return new Background(this._background);
  }

  /** The BDD that holds the Background steps, or `undefined` if there is no Background. */
  get backgroundBdd(): BDD | undefined {
    return this.hasBackground ? this._background : undefined;
  }

  /** Whether the feature has Background steps. */
  get hasBackground(): boolean {
    return this._background !== undefined && this._background.terms.length > 0;
  }

  get bdds(): BDD[] {
    return [...this._bdds];
  }

  get isEmpty(): boolean {
    return this.title.length === 0;
  }

  get isNotEmpty(): boolean {
    return this.title.length > 0;
  }

  get testResults(): TestResult[] {
    return this._bdds.map(bdd => new TestResult(bdd));
  }

  /** Adds the [bdd] to the feature. The same BDD is never added twice. */
  add(bdd: BDD): void {
    if (!this._bdds.includes(bdd)) this._bdds.push(bdd);
  }

  /** Features are equal when they have the same title. */
  equals(other: unknown): boolean {
    return other instanceof Feature && other.title === this.title;
  }

  toString(config: Config = Config._default): string {
    let result =
      config.keywordPrefix.feature +
      config.keywords.feature +
      config.keywordSuffix.feature +
      ' ' +
      config.prefix.feature +
      singleLine(this.title) +
      config.suffix.feature +
      config.endOfLineChar;

    if (this._description) result += this._description.format(config);

    return result;
  }
}
