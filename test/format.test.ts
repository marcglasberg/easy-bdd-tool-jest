import { describe, expect, test } from '@jest/globals';
import { Bdd, BDD, BddReporter, Config, Feature, FeatureDescription, gherkinSource, Keywords, row, val } from '../src';

// Tests the text of the BDDs, as written to the feature files.

/** Returns the feature with the given BDDs added to it. */
function featureWith(feature: Feature, ...bdds: BDD[]): Feature {
  bdds.forEach(bdd => feature.add(bdd));
  return feature;
}

describe('Steps', () => {
  test('A simple scenario.', () => {
    const bdd = Bdd();
    bdd.scenario('Buying stocks.').given('The user has 120 dollars.').and('No stocks.').when('Buys 1 IBM.').then('Has 1 IBM.').but('Not 2.');

    expect(bdd.toString()).toBe(
      '  Scenario: Buying stocks.\n' +
        '    Given The user has 120 dollars.\n' +
        '    And No stocks.\n' +
        '    When Buys 1 IBM.\n' +
        '    Then Has 1 IBM.\n' +
        '    But Not 2.\n',
    );
  });

  test('A scenario may start with When, or with Then.', () => {
    const bdd1 = Bdd();
    bdd1.scenario('Starts with When.').when('Something happens.').then('Something is true.');
    expect(bdd1.toString()).toBe('  Scenario: Starts with When.\n    When Something happens.\n    Then Something is true.\n');

    const bdd2 = Bdd();
    bdd2.scenario('Starts with Then.').then('Something is true.');
    expect(bdd2.toString()).toBe('  Scenario: Starts with Then.\n    Then Something is true.\n');
  });

  test('Given, with code, may be followed by Then.', () => {
    const bdd = Bdd();
    bdd.scenario('S.').given('G.').code(() => undefined).then('T.');
    expect(bdd.toString()).toBe('  Scenario: S.\n    Given G.\n    Then T.\n');
  });

  test('And, But and Note after a Then with code are Then steps (and can have examples).', () => {
    const bdd = Bdd();
    bdd
      .scenario('S.')
      .given('G <a>.')
      .then('T.')
      .code(() => undefined)
      .and('A.')
      .but('B.')
      .note('n.')
      .example(val('a', 1));

    expect(bdd.toString()).toBe(
      '  Scenario Outline: S.\n' +
        '    Given G <a>.\n' +
        '    Then T.\n' +
        '    And A.\n' +
        '    But B.\n' +
        '    # N.\n' +
        '    Examples: \n' +
        '      | a |\n' +
        '      | 1 |\n',
    );
  });

  test('A line break in a step, scenario or feature title is written as a space.', () => {
    const feature = new Feature('My\nfeature');
    const bdd = Bdd(feature);
    bdd.scenario('My\r\n  scenario').given('Line 1\nline 2.').when('A\rB.');
    featureWith(feature, bdd);

    expect(gherkinSource(feature)).toBe(
      'Feature: My feature\n\n' + '  Scenario: My scenario\n' + '    Given Line 1 line 2.\n' + '    When A B.\n',
    );
  });

  test('Each line of a note is its own comment.', () => {
    const bdd = Bdd();
    bdd.scenario('S.').given('G.').note('first line\nsecond line');
    expect(bdd.toString()).toBe('  Scenario: S.\n    Given G.\n    # First line\n    # second line\n');
  });

  test('isNote tells if a term is a note.', () => {
    const bdd = Bdd();
    bdd.scenario('S.').given('G.').note('N.');
    expect(Array.from(bdd.textTerms).map(term => term.isNote)).toEqual([false, false, true]);
  });
});

describe('Tables and examples', () => {
  test('Cells are escaped, so that the Gherkin is valid.', () => {
    const bdd = Bdd();
    bdd
      .scenario('S.')
      .given('G.')
      .table(
        'values',
        row(val('pipe', 'a|b'), val('line', 'x\ny'), val('path', 'C:\\tmp'), val('regex', '\\d+'), val('end', 'z\\')),
      );

    expect(bdd.toString()).toBe(
      '  Scenario: S.\n' +
        '    Given G.\n' +
        '      | pipe | line | path   | regex | end |\n' +
        '      | a\\|b | x\\ny | C:\\tmp | \\d+   | z\\\\ |\n',
    );
  });

  test('Column names are escaped too.', () => {
    const bdd = Bdd();
    bdd.scenario('S.').given('G.').then('T.').example(val('a|b', 1));
    expect(bdd.toString()).toContain('      | a\\|b |\n      | 1    |');
  });

  test('All example rows go into a single Examples block.', () => {
    const bdd = Bdd();
    bdd.scenario('S.').given('<a>.').then('<b>.').example(val('a', 1), val('b', 2)).example(val('a', 3), val('b', 4));

    expect(bdd.numberOfExamples()).toBe(2);
    expect(bdd.example()?.rows.length).toBe(2);
    expect(bdd.toString()).toBe(
      '  Scenario Outline: S.\n' +
        '    Given <a>.\n' +
        '    Then <b>.\n' +
        '    Examples: \n' +
        '      | a | b |\n' +
        '      | 1 | 2 |\n' +
        '      | 3 | 4 |\n',
    );
  });

  test('The Examples keyword is right-aligned too.', () => {
    const config = new Config({ rightAlignKeywords: true });
    const bdd = Bdd();
    bdd.scenario('S.').given('G.').then('T.').example(val('a', 1));
    expect(bdd.toString(config)).toContain('    Examples: \n');
    expect(bdd.toString(config)).toContain('    Given G.\n');
    expect(bdd.toString(config)).toContain('     Then T.\n');
  });
});

describe('Values', () => {
  test('null and undefined.', () => {
    expect(val('a', null).toString()).toBe('NULL');
    expect(val('a', undefined).toString()).toBe('undefined');
  });

  test('A value with a describe() method.', () => {
    expect(val('a', { describe: () => 'described' }).toString()).toBe('described');
    expect(val('a', { describe: () => null }).toString()).toBe('NULL');
    expect(val('a', { describe: 'not a function', toString: () => 'str' }).toString()).toBe('str');
  });

  test('transformDescribe may return falsy values, like 0.', () => {
    const config = new Config({ transformDescribe: obj => (obj === 'zero' ? 0 : null) });
    expect(val('a', 'zero').toString(config)).toBe('0');
    expect(val('a', 'other').toString(config)).toBe('other');
  });
});

describe('Feature', () => {
  test('Plain text description.', () => {
    const feature = new Feature('Title', 'Line 1.\nLine 2.');
    expect(feature.description).toBe('Line 1.\nLine 2.');
    expect(feature.toString()).toBe('Feature: Title\n  Line 1.\n  Line 2.\n');
  });

  test('User Story description.', () => {
    const feature = Feature.userStory('User Login', {
      asA: 'Registered User',
      iWant: 'to log into\nmy account',
      soThat: 'I can access my private dashboard',
    });

    expect(feature.description).toBeUndefined();
    expect(feature.featureDescription?.isUserStory).toBe(true);
    expect(feature.featureDescription?.asA).toBe('Registered User');
    expect(feature.toString()).toBe(
      'Feature: User Login\n' +
        '  As a Registered User\n' +
        '  I want to log into my account\n' +
        '  So that I can access my private dashboard\n',
    );

    // Same, created from a FeatureDescription.
    const feature2 = new Feature(
      'User Login',
      FeatureDescription.userStory({ asA: 'A', iWant: 'B', soThat: 'C' }),
    );
    expect(feature2.toString()).toBe('Feature: User Login\n  As a A\n  I want B\n  So that C\n');
  });

  test('Background.', () => {
    const feature = new Feature('Stocks');
    expect(feature.hasBackground).toBe(false);
    expect(feature.backgroundBdd).toBeUndefined();

    feature.background.given('The user has 100 dollars.').and('The market is open.');
    feature.background.note('A note.');
    expect(feature.hasBackground).toBe(true);
    expect(feature.backgroundBdd?.isBackground).toBe(true);

    const bdd = Bdd(feature);
    bdd.scenario('Buying.').given('G.').then('T.');
    featureWith(feature, bdd);

    expect(gherkinSource(feature)).toBe(
      'Feature: Stocks\n' +
        '\n' +
        '  Background:\n' +
        '    Given The user has 100 dollars.\n' +
        '    And The market is open.\n' +
        '    # A note.\n' +
        '\n' +
        '  Scenario: Buying.\n' +
        '    Given G.\n' +
        '    Then T.\n',
    );

    // The background also shows up in the description of each BDD.
    expect(bdd.toString(Config._default, true)).toBe(
      'Feature: Stocks\n' +
        '\n' +
        '  Background:\n' +
        '    Given The user has 100 dollars.\n' +
        '    And The market is open.\n' +
        '    # A note.\n' +
        '  Scenario: Buying.\n' +
        '    Given G.\n' +
        '    Then T.\n',
    );
  });

  test('A Background is not run by itself.', () => {
    const feature = new Feature('F');
    expect(() => feature.background.given('G.').run()).toThrow('A Background runs before each scenario');
  });

  test('The same BDD is not added twice.', () => {
    const feature = new Feature('F');
    const bdd = Bdd(feature);
    feature.add(bdd);
    feature.add(bdd);
    expect(feature.bdds).toEqual([bdd]);
  });

  test('Features are equal when they have the same title.', () => {
    expect(new Feature('A').equals(new Feature('A', 'desc'))).toBe(true);
    expect(new Feature('A').equals(new Feature('B'))).toBe(false);
  });
});

describe('Keywords', () => {
  test('Keywords.only makes the other keywords empty.', () => {
    const keywords = Keywords.only({ scenario: '\n' });
    expect(keywords.scenario).toBe('\n');
    expect(keywords.given).toBe('');
    expect(keywords.background).toBe('');
    expect(new Keywords({}).background).toBe('Background:');
    expect(new Keywords({}).asA).toBe('As a');
  });
});

describe('File names', () => {
  class TestReporter extends BddReporter {
    async report(): Promise<void> {}
  }

  test('normalizeFileName.', () => {
    const reporter = new TestReporter();
    expect(reporter.normalizeFileName('Buying and Selling Stocks')).toBe('buying_and_selling_stocks');
    expect(reporter.normalizeFileName('  Preço médio: R$ 10.00!  ')).toBe('preço_médio_r_1000');
    expect(reporter.normalizeFileName('Line\nbreak / a-b')).toBe('line_break__a-b');
  });
});
