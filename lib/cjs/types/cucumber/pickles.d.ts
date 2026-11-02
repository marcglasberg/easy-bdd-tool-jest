import type { GherkinDocument, Pickle, TableCell } from '@cucumber/messages';
/** Gherkin of a single feature, in UTF-16 code units. */
export declare const MAX_SOURCE_CHARACTERS: number;
/** Gherkin of all features plus the text created by inserting example values, in UTF-16 code units. */
export declare const MAX_EXPANDED_CHARACTERS: number;
/** Compiled test cases, steps, table rows, cells and tags, combined. */
export declare const MAX_GENERATED_ITEMS = 100000;
/** Columns of an `Examples` table. */
export declare const MAX_EXAMPLE_COLUMNS = 256;
/**
 * Limits the size of a report, shared by all the features compiled for it.
 * A failed compilation consumes its reservations: use a new budget for a new report.
 */
export declare class GherkinBudget {
    private _characters;
    private _items;
    consumeCharacters(count: number): void;
    literal(value: string): string;
    item(): void;
}
/**
 * Replaces the `<header>` tokens of a scenario outline with the values of one example row.
 * Only complete tokens of the original text are replaced. When tokens start at the same
 * position, the longest wins. Inserted values are never scanned again.
 */
export declare class ExampleTokens {
    private readonly _tokens;
    constructor(headers: readonly TableCell[]);
    interpolate(text: string, values: readonly TableCell[], budget: GherkinBudget): string;
}
/** Compiles the pickles (test cases) of the [gherkinDocument]. Rules are not supported. */
export declare function compilePickles(gherkinDocument: GherkinDocument, uri: string, newId: () => string, budget: GherkinBudget): Pickle[];
//# sourceMappingURL=pickles.d.ts.map