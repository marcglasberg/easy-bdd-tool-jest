import type { Feature } from './Feature';

/** A single line break, in any of the usual forms. */
export const lineBreak = /\r\n|\r|\n/;

/** One or more line breaks, with the spaces and tabs around them. */
const lineBreaks = /(?:[ \t]*(?:\r\n|\r|\n)[ \t]*)+/g;

/**
 * Writes line breaks as a single space. A line break in a step, scenario name or
 * feature title would otherwise start a new step or scenario in the Gherkin.
 */
export function singleLine(text: string): string {
  return text.replace(lineBreaks, ' ');
}

/**
 * Turns a feature title into a file name (without the `.feature` extension): line breaks
 * and spaces become `_`, some punctuation is removed, and the rest is lowercase. Letters
 * with accents, and letters of other alphabets, are kept.
 */
export function featureFileName(title: string): string {
  return singleLine(title)
    .trim()
    .replace(/[\s"'#<$+%>!`&*|{?=}/:\\@^.]/g, match => (match.trim() === '' ? '_' : ''))
    .toLowerCase();
}

/**
 * Escapes a table or `Examples` cell, so that it's valid Gherkin:
 * a `|` is written as `\|`, and a line break as `\n`. A backslash is escaped only
 * where Gherkin would misread it, so values like `C:\tmp` or `\d+` are unchanged.
 */
export function escapeCell(value: string): string {
  const text = value.replace(/\r\n|\r/g, '\n');
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = i + 1 < text.length ? text[i + 1] : null;
    if (char === '|') result += '\\|';
    else if (char === '\n') result += '\\n';
    else if (char === '\\' && (next === null || next === '\\' || next === '|' || next === 'n' || next === '\n'))
      result += '\\\\';
    else result += char;
  }
  return result;
}

/**
 * The Gherkin text of the [feature], with its background and all its BDDs.
 * This is the content of the `.feature` file the `FeatureFileReporter` writes.
 */
export function gherkinSource(feature: Feature): string {
  return composeGherkin(
    feature.toString(),
    feature.hasBackground ? feature.background.toString() : null,
    feature.testResults.map(test => scenarioGherkin(test.terms)),
  );
}

/** The Gherkin text of one BDD: its scenario, steps, tables and examples. */
export function scenarioGherkin(terms: Iterable<{ toString(): string }>): string {
  return Array.from(terms)
    .map(term => term.toString() + '\n')
    .join('');
}

/** The Gherkin text of a feature, from the texts of its header, background and scenarios. */
export function composeGherkin(header: string, background: string | null, scenarios: string[]): string {
  let result = header;
  if (background !== null) result += '\n' + background;
  for (const scenario of scenarios) result += '\n' + scenario;
  return result;
}
