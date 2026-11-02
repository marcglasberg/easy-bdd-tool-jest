import { Background, BDD } from './Bdd';
import { TestResult } from './TestResult';
import { Config } from './Config';
import { FeatureDescription } from './FeatureDescription';
/**
 * A Gherkin Feature. It has a title, an optional description (plain text or a User Story),
 * an optional [background], and the BDDs (scenarios) created with `Bdd(feature)`.
 */
export declare class Feature {
    readonly title: string;
    private readonly _description?;
    private readonly _bdds;
    private _background?;
    /**
     * Creates a feature with the given [title], and an optional [description].
     * For a User Story description, use [Feature.userStory] instead.
     */
    constructor(title: string, description?: string | FeatureDescription);
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
    static userStory(title: string, userStory: {
        asA: string;
        iWant: string;
        soThat: string;
    }): Feature;
    /** The plain text description, if any. */
    get description(): string | undefined;
    /** The description, which may be plain text or a User Story. */
    get featureDescription(): FeatureDescription | undefined;
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
    get background(): Background;
    /** The BDD that holds the Background steps, or `undefined` if there is no Background. */
    get backgroundBdd(): BDD | undefined;
    /** Whether the feature has Background steps. */
    get hasBackground(): boolean;
    get bdds(): BDD[];
    get isEmpty(): boolean;
    get isNotEmpty(): boolean;
    get testResults(): TestResult[];
    /** Adds the [bdd] to the feature. The same BDD is never added twice. */
    add(bdd: BDD): void;
    /** Features are equal when they have the same title. */
    equals(other: unknown): boolean;
    toString(config?: Config): string;
}
//# sourceMappingURL=Feature.d.ts.map