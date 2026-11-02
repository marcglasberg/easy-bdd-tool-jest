// Pickle compilation follows @cucumber/gherkin 42.0.1 (src/pickles/compile.ts), with bounded,
// single-pass interpolation of the example values, instead of replacing the values of each
// column in turn (which re-scans values already inserted).
// https://github.com/cucumber/gherkin/tree/main/javascript
//
// MIT License
// Copyright (c) Cucumber Ltd, Gaspar Nagy, Björn Rasmusson, Peter Sergeant, and contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
import { PickleStepType, StepKeywordType } from '@cucumber/messages';
/** Gherkin of a single feature, in UTF-16 code units. */
export const MAX_SOURCE_CHARACTERS = 1024 * 1024;
/** Gherkin of all features plus the text created by inserting example values, in UTF-16 code units. */
export const MAX_EXPANDED_CHARACTERS = 16 * 1024 * 1024;
/** Compiled test cases, steps, table rows, cells and tags, combined. */
export const MAX_GENERATED_ITEMS = 100000;
/** Columns of an `Examples` table. */
export const MAX_EXAMPLE_COLUMNS = 256;
/**
 * Limits the size of a report, shared by all the features compiled for it.
 * A failed compilation consumes its reservations: use a new budget for a new report.
 */
export class GherkinBudget {
    _characters = 0;
    _items = 0;
    consumeCharacters(count) {
        if (count > MAX_EXPANDED_CHARACTERS - this._characters) {
            throw new Error('The Gherkin source and the text created from the examples exceed the 16 Mi character limit.');
        }
        this._characters += count;
    }
    literal(value) {
        this.consumeCharacters(value.length);
        return value;
    }
    item() {
        if (this._items >= MAX_GENERATED_ITEMS) {
            throw new Error(`The Gherkin exceeds the ${MAX_GENERATED_ITEMS} generated item limit.`);
        }
        this._items++;
    }
}
/**
 * Replaces the `<header>` tokens of a scenario outline with the values of one example row.
 * Only complete tokens of the original text are replaced. When tokens start at the same
 * position, the longest wins. Inserted values are never scanned again.
 */
export class ExampleTokens {
    _tokens;
    constructor(headers) {
        if (headers.length > MAX_EXAMPLE_COLUMNS) {
            throw new Error(`An Examples table exceeds the ${MAX_EXAMPLE_COLUMNS} column limit.`);
        }
        const seen = new Set();
        for (const header of headers) {
            if (seen.has(header.value)) {
                throw new Error(`An Examples table has the column "${header.value}" more than once.`);
            }
            seen.add(header.value);
        }
        this._tokens = headers
            .map((header, index) => ({ token: `<${header.value}>`, index }))
            .sort((a, b) => b.token.length - a.token.length);
    }
    interpolate(text, values, budget) {
        if (this._tokens.length === 0)
            return budget.literal(text);
        let result = '';
        let literalStart = 0;
        let i = text.indexOf('<');
        while (i !== -1) {
            const match = this._tokens.find(({ token }) => text.startsWith(token, i));
            if (match) {
                budget.consumeCharacters(i - literalStart);
                result += text.substring(literalStart, i);
                const value = values[match.index]?.value ?? '';
                budget.consumeCharacters(value.length);
                result += value;
                literalStart = i + match.token.length;
                i = text.indexOf('<', literalStart);
            }
            else {
                i = text.indexOf('<', i + 1);
            }
        }
        budget.consumeCharacters(text.length - literalStart);
        return result + text.substring(literalStart);
    }
}
const pickleStepTypeFromKeyword = {
    [StepKeywordType.UNKNOWN]: PickleStepType.UNKNOWN,
    [StepKeywordType.CONTEXT]: PickleStepType.CONTEXT,
    [StepKeywordType.ACTION]: PickleStepType.ACTION,
    [StepKeywordType.OUTCOME]: PickleStepType.OUTCOME,
    [StepKeywordType.CONJUNCTION]: undefined,
};
/** Compiles the pickles (test cases) of the [gherkinDocument]. Rules are not supported. */
export function compilePickles(gherkinDocument, uri, newId, budget) {
    const pickles = [];
    const feature = gherkinDocument.feature;
    if (!feature)
        return pickles;
    const language = feature.language;
    let backgroundSteps = [];
    for (const child of feature.children) {
        if (child.background) {
            backgroundSteps = child.background.steps;
        }
        else if (child.rule) {
            throw new Error('Gherkin Rules are not supported.');
        }
        else if (child.scenario) {
            if (child.scenario.examples.length === 0) {
                compileScenario(feature.tags, backgroundSteps, child.scenario, language, pickles, uri, newId, budget);
            }
            else {
                compileScenarioOutline(feature.tags, backgroundSteps, child.scenario, language, pickles, uri, newId, budget);
            }
        }
    }
    return pickles;
}
function compileScenario(inheritedTags, backgroundSteps, scenario, language, pickles, uri, newId, budget) {
    const literal = text => budget.literal(text);
    budget.item();
    const steps = compileSteps(backgroundSteps, scenario, literal, undefined, newId, budget);
    pickles.push({
        id: newId(),
        uri,
        location: scenario.location,
        astNodeIds: [scenario.id],
        tags: pickleTags([...inheritedTags, ...scenario.tags], budget),
        name: budget.literal(scenario.name),
        language,
        steps,
    });
}
function compileScenarioOutline(inheritedTags, backgroundSteps, scenario, language, pickles, uri, newId, budget) {
    for (const examples of scenario.examples) {
        if (!examples.tableHeader)
            continue;
        const tokens = new ExampleTokens(examples.tableHeader.cells);
        for (const valuesRow of examples.tableBody) {
            const interpolate = text => tokens.interpolate(text, valuesRow.cells, budget);
            budget.item();
            const steps = compileSteps(backgroundSteps, scenario, interpolate, valuesRow, newId, budget);
            pickles.push({
                id: newId(),
                uri,
                location: valuesRow.location,
                astNodeIds: [scenario.id, valuesRow.id],
                tags: pickleTags([...inheritedTags, ...scenario.tags, ...examples.tags], budget),
                name: interpolate(scenario.name),
                language,
                steps,
            });
        }
    }
}
function compileSteps(backgroundSteps, scenario, interpolate, valuesRow, newId, budget) {
    const steps = [];
    let lastKeywordType = StepKeywordType.UNKNOWN;
    const keywordTypeOf = (step) => {
        if (step.keywordType !== StepKeywordType.CONJUNCTION && step.keywordType !== undefined) {
            lastKeywordType = step.keywordType;
        }
        return lastKeywordType;
    };
    if (scenario.steps.length !== 0) {
        const literal = text => budget.literal(text);
        for (const step of backgroundSteps) {
            steps.push(pickleStep(step, literal, undefined, newId, keywordTypeOf(step), budget));
        }
    }
    for (const step of scenario.steps) {
        steps.push(pickleStep(step, interpolate, valuesRow, newId, keywordTypeOf(step), budget));
    }
    return steps;
}
function pickleStep(step, interpolate, valuesRow, newId, keywordType, budget) {
    budget.item();
    const astNodeIds = valuesRow ? [step.id, valuesRow.id] : [step.id];
    return {
        id: newId(),
        text: interpolate(step.text),
        type: pickleStepTypeFromKeyword[keywordType],
        argument: createPickleArguments(step, interpolate, budget),
        astNodeIds,
    };
}
function createPickleArguments(step, interpolate, budget) {
    if (step.dataTable)
        return { dataTable: pickleTable(step.dataTable, interpolate, budget) };
    if (step.docString)
        return { docString: pickleDocString(step.docString, interpolate) };
    return undefined;
}
function pickleDocString(argument, interpolate) {
    return {
        content: interpolate(argument.content),
        mediaType: argument.mediaType ? interpolate(argument.mediaType) : undefined,
    };
}
function pickleTable(argument, interpolate, budget) {
    return {
        rows: argument.rows.map(row => {
            budget.item();
            return {
                cells: row.cells.map(cell => {
                    budget.item();
                    return { value: interpolate(cell.value) };
                }),
            };
        }),
    };
}
function pickleTags(tags, budget) {
    return tags.map(tag => {
        budget.item();
        return { name: budget.literal(tag.name), astNodeId: tag.id };
    });
}
