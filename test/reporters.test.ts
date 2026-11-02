import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Bdd, ConsoleReporter, Feature, FeatureFileReporter, gherkinSource } from '../src';

/** Captures what is written to stdout while [fn] runs. */
async function captureStdout(fn: () => Promise<void>): Promise<string> {
  let output = '';
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  });
  try {
    await fn();
  } finally {
    spy.mockRestore();
  }
  return output;
}

/** A feature with a background and 2 BDDs, added to the [reporter]. */
function addFeature(reporter: ConsoleReporter | FeatureFileReporter, title = 'Buying and Selling Stocks'): Feature {
  const feature = new Feature(title);
  feature.background.given('The user has 100 dollars.');

  const bdd1 = Bdd(feature);
  bdd1.scenario('Buying.').given('G.').when('W.').then('T.');
  const bdd2 = Bdd(feature);
  bdd2.scenario('Selling.').given('G.').then('T.');

  // A BDD is added to each reporter. Adding it twice must not duplicate it.
  reporter._addBdd(bdd1);
  reporter._addBdd(bdd2);
  reporter._addBdd(bdd2);
  return feature;
}

describe('ConsoleReporter', () => {
  test('Prints the features, background and BDDs.', async () => {
    const reporter = new ConsoleReporter();
    addFeature(reporter);
    const output = await captureStdout(() => reporter.report());

    expect(output).toBe(
      'Feature 1 --------------\n\n' +
        'Feature: Buying and Selling Stocks\n\n' +
        '  Background:\n' +
        '    Given The user has 100 dollars.\n\n' +
        '  Scenario: Buying.\n' +
        '    Given G.\n' +
        '     When W.\n' +
        '     Then T.\n\n' +
        '  Scenario: Selling.\n' +
        '    Given G.\n' +
        '     Then T.\n\n',
    );
  });
});

describe('FeatureFileReporter', () => {
  let dir: string;
  const originalDir = FeatureFileReporter.dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'easy-bdd-'));
    FeatureFileReporter.dir = dir;
  });

  afterEach(async () => {
    FeatureFileReporter.dir = originalDir;
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('Writes one feature file per feature.', async () => {
    const reporter = new FeatureFileReporter();
    const feature = addFeature(reporter);
    const output = await captureStdout(() => reporter.report());

    const content = await fs.readFile(join(dir, 'buying_and_selling_stocks.feature'), 'utf-8');
    expect(content).toBe(gherkinSource(feature));
    expect(content).toBe(
      'Feature: Buying and Selling Stocks\n\n' +
        '  Background:\n' +
        '    Given The user has 100 dollars.\n\n' +
        '  Scenario: Buying.\n' +
        '    Given G.\n' +
        '    When W.\n' +
        '    Then T.\n\n' +
        '  Scenario: Selling.\n' +
        '    Given G.\n' +
        '    Then T.\n',
    );

    expect(output).toContain(`Feature files will be saved in ${dir}/\n`);
    expect(output).toContain('buying_and_selling_stocks.feature. Done!\n');
    expect(output).toContain('Finished.\n');
    expect(output).not.toContain("'");
  });

  test('clearAllOutputBeforeRun deletes only old feature files directly inside the directory.', async () => {
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldFeature = join(dir, 'old.feature');
    const newFeature = join(dir, 'written_by_another_test_file.feature');
    const otherFile = join(dir, 'notes.txt');
    const subdirFeature = join(dir, 'subdir', 'kept.feature');

    await fs.writeFile(oldFeature, 'old');
    await fs.utimes(oldFeature, old, old);
    await fs.writeFile(newFeature, 'new');
    await fs.writeFile(otherFile, 'other');
    await fs.utimes(otherFile, old, old);
    await fs.mkdir(join(dir, 'subdir'));
    await fs.writeFile(subdirFeature, 'kept');
    await fs.utimes(subdirFeature, old, old);

    const reporter = new FeatureFileReporter({ clearAllOutputBeforeRun: true });
    addFeature(reporter);
    await captureStdout(() => reporter.report());

    const exists = (path: string) =>
      fs.access(path).then(
        () => true,
        () => false,
      );
    expect(await exists(oldFeature)).toBe(false);
    expect(await exists(newFeature)).toBe(true);
    expect(await exists(otherFile)).toBe(true);
    expect(await exists(subdirFeature)).toBe(true);
    expect(await exists(join(dir, 'buying_and_selling_stocks.feature'))).toBe(true);
  });

  test('Without clearAllOutputBeforeRun, nothing is deleted.', async () => {
    const oldFeature = join(dir, 'old.feature');
    await fs.writeFile(oldFeature, 'old');
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await fs.utimes(oldFeature, old, old);

    const reporter = new FeatureFileReporter();
    addFeature(reporter);
    await captureStdout(() => reporter.report());
    await expect(fs.access(oldFeature)).resolves.toBeUndefined();
  });

  test('An empty dir means the current directory.', () => {
    FeatureFileReporter.dir = '';
    expect(new FeatureFileReporter().directory).toBe('./');
    FeatureFileReporter.dir = 'a/b';
    expect(new FeatureFileReporter().directory).toBe('a/b/');
    FeatureFileReporter.dir = 'a\\b\\';
    expect(new FeatureFileReporter().directory).toBe('a\\b\\');
  });

  test('Says which feature failed, and why.', async () => {
    // A directory where the file should be makes writing it fail.
    await fs.mkdir(join(dir, 'buying_and_selling_stocks.feature'));

    const reporter = new FeatureFileReporter();
    addFeature(reporter);
    const output = await captureStdout(() => reporter.report());

    expect(output).toContain('Failed! Could not generate feature "Buying and Selling Stocks": ');
    expect(output).toMatch(/Error: E\w+/);
  });
});
