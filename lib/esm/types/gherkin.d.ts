import type { Feature } from './Feature';
/** A single line break, in any of the usual forms. */
export declare const lineBreak: RegExp;
/**
 * Writes line breaks as a single space. A line break in a step, scenario name or
 * feature title would otherwise start a new step or scenario in the Gherkin.
 */
export declare function singleLine(text: string): string;
/**
 * Turns a feature title into a file name (without the `.feature` extension): line breaks
 * and spaces become `_`, some punctuation is removed, and the rest is lowercase. Letters
 * with accents, and letters of other alphabets, are kept.
 */
export declare function featureFileName(title: string): string;
/**
 * Escapes a table or `Examples` cell, so that it's valid Gherkin:
 * a `|` is written as `\|`, and a line break as `\n`. A backslash is escaped only
 * where Gherkin would misread it, so values like `C:\tmp` or `\d+` are unchanged.
 */
export declare function escapeCell(value: string): string;
/**
 * The Gherkin text of the [feature], with its background and all its BDDs.
 * This is the content of the `.feature` file the `FeatureFileReporter` writes.
 */
export declare function gherkinSource(feature: Feature): string;
/** The Gherkin text of one BDD: its scenario, steps, tables and examples. */
export declare function scenarioGherkin(terms: Iterable<{
    toString(): string;
}>): string;
/** The Gherkin text of a feature, from the texts of its header, background and scenarios. */
export declare function composeGherkin(header: string, background: string | null, scenarios: string[]): string;
//# sourceMappingURL=gherkin.d.ts.map