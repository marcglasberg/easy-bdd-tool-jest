import { Config } from './Config';
import { singleLine } from './gherkin';
/**
 * The description of a feature. It can be a plain text description,
 * or a structured User Story ("As a ... I want ... So that ...").
 */
export class FeatureDescription {
    /** The plain text description, if any. */
    text;
    /** The "As a" part of the User Story. */
    asA;
    /** The "I want" part of the User Story. */
    iWant;
    /** The "So that" part of the User Story. */
    soThat;
    constructor(fields) {
        this.text = fields.text;
        this.asA = fields.asA;
        this.iWant = fields.iWant;
        this.soThat = fields.soThat;
    }
    /** Creates a plain text description. */
    static text(text) {
        return new FeatureDescription({ text });
    }
    /** Creates a structured User Story description. */
    static userStory({ asA, iWant, soThat }) {
        return new FeatureDescription({ asA, iWant, soThat });
    }
    get isUserStory() {
        return this.text === undefined;
    }
    /** Formats the description, as it appears below the feature title. */
    format(config = Config._default) {
        if (this.text !== undefined) {
            const parts = this.text.trim().split(/\r\n|\r|\n/);
            return (config.spaces +
                config.prefix.feature +
                parts.join(config.endOfLineChar + config.spaces) +
                config.suffix.feature +
                config.endOfLineChar);
        }
        return (this._line(config, config.keywords.asA, this.asA) +
            this._line(config, config.keywords.iWant, this.iWant) +
            this._line(config, config.keywords.soThat, this.soThat));
    }
    _line(config, keyword, text) {
        return config.spaces + keyword + ' ' + singleLine(text) + config.endOfLineChar;
    }
}
