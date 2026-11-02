"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
const Bdd_1 = require("./Bdd");
const TestResult_1 = require("./TestResult");
const Config_1 = require("./Config");
const FeatureDescription_1 = require("./FeatureDescription");
const gherkin_1 = require("./gherkin");
/**
 * A Gherkin Feature. It has a title, an optional description (plain text or a User Story),
 * an optional [background], and the BDDs (scenarios) created with `Bdd(feature)`.
 */
class Feature {
    /**
     * Creates a feature with the given [title], and an optional [description].
     * For a User Story description, use [Feature.userStory] instead.
     */
    constructor(title, description) {
        this.title = title;
        this._description =
            typeof description === 'string' ? FeatureDescription_1.FeatureDescription.text(description) : (description !== null && description !== void 0 ? description : undefined);
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
    static userStory(title, userStory) {
        return new Feature(title, FeatureDescription_1.FeatureDescription.userStory(userStory));
    }
    /** The plain text description, if any. */
    get description() {
        var _a;
        return (_a = this._description) === null || _a === void 0 ? void 0 : _a.text;
    }
    /** The description, which may be plain text or a User Story. */
    get featureDescription() {
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
    get background() {
        var _a;
        (_a = this._background) !== null && _a !== void 0 ? _a : (this._background = new Bdd_1.BDD(this, true));
        return new Bdd_1.Background(this._background);
    }
    /** The BDD that holds the Background steps, or `undefined` if there is no Background. */
    get backgroundBdd() {
        return this.hasBackground ? this._background : undefined;
    }
    /** Whether the feature has Background steps. */
    get hasBackground() {
        return this._background !== undefined && this._background.terms.length > 0;
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
        return this._bdds.map(bdd => new TestResult_1.TestResult(bdd));
    }
    /** Adds the [bdd] to the feature. The same BDD is never added twice. */
    add(bdd) {
        if (!this._bdds.includes(bdd))
            this._bdds.push(bdd);
    }
    /** Features are equal when they have the same title. */
    equals(other) {
        return other instanceof Feature && other.title === this.title;
    }
    toString(config = Config_1.Config._default) {
        let result = config.keywordPrefix.feature +
            config.keywords.feature +
            config.keywordSuffix.feature +
            ' ' +
            config.prefix.feature +
            (0, gherkin_1.singleLine)(this.title) +
            config.suffix.feature +
            config.endOfLineChar;
        if (this._description)
            result += this._description.format(config);
        return result;
    }
}
exports.Feature = Feature;
