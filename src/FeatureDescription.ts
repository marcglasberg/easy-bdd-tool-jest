import { Config } from './Config';
import { singleLine } from './gherkin';

/**
 * The description of a feature. It can be a plain text description,
 * or a structured User Story ("As a ... I want ... So that ...").
 */
export class FeatureDescription {
  /** The plain text description, if any. */
  readonly text?: string;

  /** The "As a" part of the User Story. */
  readonly asA?: string;

  /** The "I want" part of the User Story. */
  readonly iWant?: string;

  /** The "So that" part of the User Story. */
  readonly soThat?: string;

  private constructor(fields: { text?: string; asA?: string; iWant?: string; soThat?: string }) {
    this.text = fields.text;
    this.asA = fields.asA;
    this.iWant = fields.iWant;
    this.soThat = fields.soThat;
  }

  /** Creates a plain text description. */
  static text(text: string): FeatureDescription {
    return new FeatureDescription({ text });
  }

  /** Creates a structured User Story description. */
  static userStory({ asA, iWant, soThat }: { asA: string; iWant: string; soThat: string }): FeatureDescription {
    return new FeatureDescription({ asA, iWant, soThat });
  }

  get isUserStory(): boolean {
    return this.text === undefined;
  }

  /** Formats the description, as it appears below the feature title. */
  format(config: Config = Config._default): string {
    if (this.text !== undefined) {
      const parts = this.text.trim().split(/\r\n|\r|\n/);
      return (
        config.spaces +
        config.prefix.feature +
        parts.join(config.endOfLineChar + config.spaces) +
        config.suffix.feature +
        config.endOfLineChar
      );
    }

    return (
      this._line(config, config.keywords.asA, this.asA!) +
      this._line(config, config.keywords.iWant, this.iWant!) +
      this._line(config, config.keywords.soThat, this.soThat!)
    );
  }

  private _line(config: Config, keyword: string, text: string): string {
    return config.spaces + keyword + ' ' + singleLine(text) + config.endOfLineChar;
  }
}
