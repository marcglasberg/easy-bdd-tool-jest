import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import type { Envelope } from '@cucumber/messages';

// Runs test files in a separate Jest process, with the JestReporter in its `reporters`.
// Jest loads reporters with Node's own require, so the reporter is compiled first.

const root = join(__dirname, '..');
const buildDir = join(root, 'node_modules', '.cache', 'easy-bdd-tool-jest-test-build');
let outputDir: string;

beforeAll(() => {
  rmSync(buildDir, { recursive: true, force: true });
  const result = spawnSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      '-p',
      join(root, 'tsconfig.cjs.json'),
      '--outDir',
      buildDir,
      '--declarationDir',
      join(buildDir, 'types'),
    ],
    { cwd: root, encoding: 'utf-8' },
  );
  if (result.status !== 0) throw new Error(`Could not compile the reporter:\n${result.stdout}\n${result.stderr}`);

  // Resolve links (like /var on macOS), since the reporter rejects them.
  outputDir = mkdtempSync(join(realpathSync(tmpdir()), 'easy-bdd-reporter-test-'));
}, 120000);

afterAll(() => {
  rmSync(buildDir, { recursive: true, force: true });
  if (outputDir) rmSync(outputDir, { recursive: true, force: true });
});

function runJest(testMatch: string, options: object, args: string[] = []) {
  const config = {
    rootDir: root,
    roots: ['<rootDir>/test/fixtures'],
    testMatch: [testMatch],
    testEnvironment: 'node',
    transform: { '^.+\\.ts$': 'ts-jest' },
    reporters: ['default', [join(buildDir, 'jest-reporter.js'), options]],
  };
  const result = spawnSync(
    process.execPath,
    [require.resolve('jest/bin/jest'), '--config', JSON.stringify(config), '--ci', '--colors=false', ...args],
    { cwd: root, encoding: 'utf-8', env: { ...process.env, FORCE_COLOR: '0' } },
  );
  return { status: result.status, stdout: plain(result.stdout), stderr: plain(result.stderr) };
}

function plain(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

describe('JestReporter', () => {
  test('Summary, feature files and Cucumber results of several test files.', () => {
    const featuresDir = join(outputDir, 'features');
    const resultsFile = join(outputDir, 'cucumber', 'results.ndjson');

    // Old files: the old feature file must be deleted, the other file kept,
    // and the old report must not survive.
    mkdirSync(featuresDir, { recursive: true });
    writeFileSync(join(featuresDir, 'old.feature'), 'old');
    writeFileSync(join(featuresDir, 'notes.txt'), 'notes');
    mkdirSync(join(outputDir, 'cucumber'));
    writeFileSync(resultsFile, 'old report');

    const { status, stdout, stderr } = runJest(
      '**/fixtures/reporter/*.fixture.ts',
      {
        featureFiles: { dir: featuresDir, clearAllOutputBeforeRun: true },
        cucumberResults: { outputFile: resultsFile },
      },
      ['--maxWorkers=2'],
    );

    expect(stderr).toMatch(/Tests:\s+3 failed, 1 skipped, 4 passed, 8 total/);
    expect(status).toBe(1);

    // The summary of all test files.
    expect(stdout).toContain(
      'BDD RESULTS ══════════════════════════════════════════\n' +
        'TOTAL: 8 tests (7 BDDs)\nPASSED: 4 tests\nFAILED: 3 tests\nSKIPPED: 1 tests\n',
    );

    // One feature file per feature, with the BDDs of both test files.
    expect(existsSync(join(featuresDir, 'old.feature'))).toBe(false);
    expect(existsSync(join(featuresDir, 'notes.txt'))).toBe(true);
    const stocks = readFileSync(join(featuresDir, 'stocks.feature'), 'utf-8');
    expect(stocks).toBe(
      'Feature: Stocks\n' +
        '  Buying and selling.\n' +
        '\n' +
        '  Background:\n' +
        '    Given The market is open.\n' +
        '\n' +
        '  Scenario: Buying.\n' +
        '    Given The user has 100 dollars.\n' +
        '    When The user buys 1 IBM.\n' +
        '    Then The user has 1 IBM.\n' +
        '\n' +
        '  Scenario: Selling fails.\n' +
        '    Given The user has 1 IBM.\n' +
        '    When The user sells 2 IBM.\n' +
        '    Then The user has no IBM.\n' +
        '\n' +
        '  Scenario Outline: The number <n>.\n' +
        '    Given The number <n>.\n' +
        '    # A note.\n' +
        '    Then It is positive.\n' +
        '      | a |\n' +
        '      | 1 |\n' +
        '    Examples: \n' +
        '      | n |\n' +
        '      | 1 |\n' +
        '      | 2 |\n' +
        '\n' +
        '  Scenario: Skipped.\n' +
        '    Given Given.\n' +
        '\n' +
        '  Scenario: Times out.\n' +
        '    Given Something slow.\n' +
        '\n' +
        '  Scenario: Retried.\n' +
        '    Given It fails the first time.\n',
    );
    new Parser(new AstBuilder(IdGenerator.incrementing()), new GherkinClassicTokenMatcher()).parse(stocks);
    expect(readFileSync(join(featuresDir, 'other.feature'), 'utf-8')).toBe(
      'Feature: Other\n\n  Scenario: Other.\n    When Something happens.\n    Then Something is true.\n',
    );

    // The Cucumber results.
    const envelopes: Envelope[] = readFileSync(resultsFile, 'utf-8')
      .trimEnd()
      .split('\n')
      .map(line => JSON.parse(line));
    checkReferences(envelopes);

    expect(envelopes[0].meta?.implementation.name).toBe('easy-bdd-tool-jest');
    expect(envelopes.filter(e => e.source).map(e => e.source!.uri)).toEqual(['stocks.feature', 'other.feature']);
    expect(envelopes.filter(e => e.source)[0].source!.data).toBe(stocks);
    expect(envelopes.filter(e => e.testCase).length).toBe(8);
    expect(envelopes[envelopes.length - 1].testRunFinished?.success).toBe(false);

    const results = stepResults(envelopes);
    expect(results.get('Buying.')).toEqual([['PASSED', 'PASSED', 'PASSED', 'PASSED']]);
    expect(results.get('Selling fails.')).toEqual([['PASSED', 'PASSED', 'FAILED', 'SKIPPED']]);
    // The two example rows. The .run() callback is a hook, after the steps.
    expect(results.get('The number 1.')).toEqual([['PASSED', 'PASSED', 'PASSED', 'PASSED']]);
    expect(results.get('The number 2.')).toEqual([['PASSED', 'PASSED', 'PASSED', 'FAILED']]);
    expect(results.get('Skipped.')).toEqual([['SKIPPED', 'SKIPPED']]);
    // Retried once (jest.retryTimes), and timed out both times.
    expect(results.get('Times out.')).toEqual([
      ['PASSED', 'FAILED'],
      ['PASSED', 'FAILED'],
    ]);
    expect(results.get('Retried.')).toEqual([
      ['PASSED', 'FAILED'],
      ['PASSED', 'PASSED'],
    ]);
    expect(results.get('Other.')).toEqual([['PASSED', 'PASSED']]);

    const messages = envelopes
      .filter(e => e.testStepFinished?.testStepResult.status === 'FAILED')
      .map(e => e.testStepFinished!.testStepResult.message ?? '');
    expect(messages.some(m => m.startsWith('Error: Cannot sell.\n'))).toBe(true);
    expect(messages.some(m => m.startsWith('Error: Two fails.\n'))).toBe(true);
    expect(messages.filter(m => m === 'The step did not finish. It may have timed out.').length).toBe(2);
    expect(messages.join('\n')).not.toMatch(/src[\\/](Bdd|BddRunner|BddExecution)\.ts/);

    const retried = envelopes.filter(e => e.testCaseFinished).map(e => e.testCaseFinished!.willBeRetried);
    expect(retried.filter(r => r).length).toBe(2);

    expect(stdout).toContain(`Feature files saved in ${featuresDir}`);
    expect(stdout).toContain(`Cucumber results saved in ${resultsFile}`);
  }, 120000);

  test('Summary only, in a single process.', () => {
    const { status, stdout } = runJest('**/fixtures/only.fixture.ts', {}, ['--runInBand']);
    expect(status).toBe(0);
    expect(stdout).toContain('TOTAL: 3 tests (3 BDDs)\nPASSED: 1 tests\nFAILED: 0 tests\nSKIPPED: 2 tests\n');
  }, 60000);
});

/** For each test case (by pickle name), the step statuses of each attempt. */
function stepResults(envelopes: Envelope[]): Map<string, string[][]> {
  const pickleNames = new Map(envelopes.filter(e => e.pickle).map(e => [e.pickle!.id, e.pickle!.name]));
  const testCases = new Map(envelopes.filter(e => e.testCase).map(e => [e.testCase!.id, e.testCase!]));
  const attempts = new Map<string, string[]>();
  const result = new Map<string, string[][]>();

  for (const envelope of envelopes) {
    if (envelope.testCaseStarted) {
      const started = envelope.testCaseStarted;
      const name = pickleNames.get(testCases.get(started.testCaseId)!.pickleId)!;
      const statuses: string[] = [];
      attempts.set(started.id, statuses);
      result.set(name, [...(result.get(name) ?? []), statuses]);
    }
    if (envelope.testStepFinished) {
      attempts.get(envelope.testStepFinished.testCaseStartedId)!.push(envelope.testStepFinished.testStepResult.status);
    }
  }
  return result;
}

/** Checks that the ids are unique, and that the references point to existing messages. */
function checkReferences(envelopes: Envelope[]): void {
  const ids = new Set<string>();
  const add = (id: string) => {
    expect(ids.has(id)).toBe(false);
    ids.add(id);
  };
  for (const e of envelopes) {
    if (e.pickle) {
      add(e.pickle.id);
      e.pickle.steps.forEach(step => add(step.id));
    }
    if (e.hook) add(e.hook.id);
    if (e.testCase) {
      add(e.testCase.id);
      e.testCase.testSteps.forEach(step => add(step.id));
    }
    if (e.testCaseStarted) add(e.testCaseStarted.id);
  }
  for (const e of envelopes) {
    if (e.testCase) {
      expect(ids.has(e.testCase.pickleId)).toBe(true);
      e.testCase.testSteps.forEach(step => expect(ids.has(step.pickleStepId ?? step.hookId!)).toBe(true));
    }
    if (e.testCaseStarted) expect(ids.has(e.testCaseStarted.testCaseId)).toBe(true);
    if (e.testStepFinished) {
      expect(ids.has(e.testStepFinished.testCaseStartedId)).toBe(true);
      expect(ids.has(e.testStepFinished.testStepId)).toBe(true);
    }
  }
}
