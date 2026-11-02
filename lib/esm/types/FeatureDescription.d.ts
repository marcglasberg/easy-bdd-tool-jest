import { Config } from './Config';
/**
 * The description of a feature. It can be a plain text description,
 * or a structured User Story ("As a ... I want ... So that ...").
 */
export declare class FeatureDescription {
    /** The plain text description, if any. */
    readonly text?: string;
    /** The "As a" part of the User Story. */
    readonly asA?: string;
    /** The "I want" part of the User Story. */
    readonly iWant?: string;
    /** The "So that" part of the User Story. */
    readonly soThat?: string;
    private constructor();
    /** Creates a plain text description. */
    static text(text: string): FeatureDescription;
    /** Creates a structured User Story description. */
    static userStory({ asA, iWant, soThat }: {
        asA: string;
        iWant: string;
        soThat: string;
    }): FeatureDescription;
    get isUserStory(): boolean;
    /** Formats the description, as it appears below the feature title. */
    format(config?: Config): string;
    private _line;
}
//# sourceMappingURL=FeatureDescription.d.ts.map