import { describe, expect, test } from '@jest/globals';
import { AstBuilder, compile, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import type { GherkinDocument, Pickle } from '@cucumber/messages';
import { Bdd, BDD, Feature, gherkinSource, row, val } from '../src';

// Reads the exported feature files with Cucumber's official Gherkin parser,
// to make sure they are valid Gherkin, and that the values survive the round trip.

function parse(source: string): { document: GherkinDocument; pickles: readonly Pickle[] } {
  const newId = IdGenerator.incrementing();
  const parser = new Parser(new AstBuilder(newId), new GherkinClassicTokenMatcher());
  const document = parser.parse(source); // Throws if the Gherkin is invalid.
  const pickles = compile(document, 'test.feature', newId);
  return { document, pickles };
}

function exportFeature(feature: Feature, ...bdds: BDD[]): string {
  bdds.forEach(bdd => feature.add(bdd));
  return gherkinSource(feature);
}

describe('Exported feature files are valid Gherkin', () => {
  test('A user story, background, outline and examples.', () => {
    const feature = Feature.userStory('Average Price', {
      asA: 'Stock Investor',
      iWant: 'to see my portfolio average price updated',
      soThat: 'I can make better investment decisions',
    });
    feature.background.given('The user has 100,000 dollars in cash-balance.');

    const bdd = Bdd(feature);
    bdd
      .scenario('Buying and Selling stocks changes the average price.')
      .given('The user has <Quantity> shares of <Ticker> at <At> dollars each.')
      .when('The user <BuyOrSell> <How many> of these stock at <Price> for each share.')
      .then('The number of shares becomes <Quantity> plus/minus <How many>.')
      .and('The average price for the stock becomes <Average Price>.')
      .example(
        val('Ticker', 'IBM'),
        val('Quantity', 10),
        val('At', 100.0),
        val('BuyOrSell', 'buy'),
        val('How many', 2),
        val('Price', 50.0),
        val('Average Price', 91.67),
      )
      .example(
        val('Ticker', 'IBM'),
        val('Quantity', 8),
        val('At', 200.0),
        val('BuyOrSell', 'sell'),
        val('How many', 3),
        val('Price', 30.0),
        val('Average Price', 302.0),
      );

    const { document, pickles } = parse(exportFeature(feature, bdd));
    const gherkinFeature = document.feature!;

    expect(gherkinFeature.name).toBe('Average Price');
    expect(gherkinFeature.description).toBe(
      '  As a Stock Investor\n' +
        '  I want to see my portfolio average price updated\n' +
        '  So that I can make better investment decisions',
    );

    const [background, scenario] = gherkinFeature.children;
    expect(background.background?.steps.map(step => step.text)).toEqual([
      'The user has 100,000 dollars in cash-balance.',
    ]);
    expect(scenario.scenario?.keyword).toBe('Scenario Outline');
    expect(scenario.scenario?.examples[0].tableBody.length).toBe(2);

    // One pickle per example row, with the background step first.
    expect(pickles.length).toBe(2);
    expect(pickles[1].steps.map(step => step.text)).toEqual([
      'The user has 100,000 dollars in cash-balance.',
      'The user has 8 shares of IBM at 200 dollars each.',
      'The user sell 3 of these stock at 30 for each share.',
      'The number of shares becomes 8 plus/minus 3.',
      'The average price for the stock becomes 302.',
    ]);
  });

  test('Table and example cells keep their values.', () => {
    const values = ['a|b', 'x\ny', 'C:\\tmp', '\\d+', 'z\\', 'back\\|slash', 'n\\n'];

    const feature = new Feature('Cells');
    const bdd = Bdd(feature);
    bdd
      .scenario('Cells.')
      .given('A table.')
      .table(
        'table',
        row(
          val('col0', values[0]),
          val('col1', values[1]),
          val('col2', values[2]),
          val('col3', values[3]),
          val('col4', values[4]),
          val('col5', values[5]),
          val('col6', values[6]),
        ),
      )
      .when('Nothing happens.')
      .then('The value is <v>.')
      .example(val('v', values[0]))
      .example(val('v', values[1]))
      .example(val('v', values[2]))
      .example(val('v', values[3]))
      .example(val('v', values[4]))
      .example(val('v', values[5]))
      .example(val('v', values[6]));

    const { document } = parse(exportFeature(feature, bdd));
    const scenario = document.feature!.children[0].scenario!;

    const tableRows = scenario.steps[0].dataTable!.rows;
    expect(tableRows[1].cells.map(cell => cell.value)).toEqual(values);

    const exampleRows = scenario.examples[0].tableBody;
    expect(exampleRows.map(r => r.cells[0].value)).toEqual(values);
  });

  test('Line breaks in titles, steps and notes.', () => {
    const feature = new Feature('A feature\nwith a line break');
    const bdd = Bdd(feature);
    bdd
      .scenario('A scenario\nwith a line break')
      .given('A step\nwith a line break.')
      .note('A note\nwith two lines.')
      .when('Scenario: this is not a scenario.\nGiven this is not a step.')
      .then('Done.');

    const { document, pickles } = parse(exportFeature(feature, bdd));
    expect(document.feature!.name).toBe('A feature with a line break');
    expect(document.feature!.children.length).toBe(1);
    expect(document.feature!.children[0].scenario!.name).toBe('A scenario with a line break');
    expect(pickles[0].steps.map(step => step.text)).toEqual([
      'A step with a line break.',
      'Scenario: this is not a scenario. Given this is not a step.',
      'Done.',
    ]);
    expect(document.comments.map(comment => comment.text.trim())).toEqual([
      '# A note',
      '# with two lines.',
    ]);
  });

  test('Several scenarios, starting with Given, When or Then.', () => {
    const feature = new Feature('Several');
    const bdd1 = Bdd(feature);
    bdd1.scenario('One.').given('G.').when('W.').then('T.');
    const bdd2 = Bdd(feature);
    bdd2.scenario('Two.').when('W.').then('T.');
    const bdd3 = Bdd(feature);
    bdd3.scenario('Three.').then('T.').but('B.');

    const { pickles } = parse(exportFeature(feature, bdd1, bdd2, bdd3));
    expect(pickles.map(pickle => pickle.name)).toEqual(['One.', 'Two.', 'Three.']);
    expect(pickles[2].steps.map(step => step.text)).toEqual(['T.', 'B.']);
  });
});
