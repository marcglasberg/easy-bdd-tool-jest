import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { promises as fs, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { AstBuilder, compile, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import type { GherkinDocument } from '@cucumber/messages';
import { compilePickles, GherkinBudget, MAX_EXAMPLE_COLUMNS } from '../src/cucumber/pickles';
import { invalidateOutput, writeOutput } from '../src/cucumber/output';
import { buildCucumberMessages } from '../src/cucumber/CucumberMessages';
import { readRunResults } from '../src/runResults';
import type { JestResults, RunResults } from '../src/runResults';
import { RUN_DATA_VERSION } from '../src/runData';
import type { RunEvent } from '../src/runData';

function parse(source: string, newId = IdGenerator.incrementing()): GherkinDocument {
  return new Parser(new AstBuilder(newId), new GherkinClassicTokenMatcher()).parse(source);
}

function outline(headers: string[], values: string[], step = 'Given <a>.'): string {
  return (
    'Feature: F\n\n  Scenario Outline: S\n' +
    `    ${step}\n` +
    '    Examples:\n' +
    `      | ${headers.join(' | ')} |\n` +
    `      | ${values.join(' | ')} |\n`
  );
}

function stepTexts(source: string): string[] {
  const pickles = compilePickles(parse(source), 'f.feature', IdGenerator.incrementing(), new GherkinBudget());
  return pickles.flatMap(pickle => pickle.steps.map(step => step.text));
}

describe('Pickles', () => {
  test('Normal Gherkin compiles exactly like @cucumber/gherkin.', () => {
    const source =
      'Feature: F\n\n  Background:\n    Given B.\n\n' +
      '  Scenario: One\n    Given G.\n    And A.\n    When W.\n      | x | y |\n      | 1 | 2 |\n    Then T.\n\n' +
      '  Scenario Outline: Two <n>\n    Given <n> and <m>.\n      | <n> |\n    Then <m>.\n' +
      '    Examples:\n      | n | m |\n      | 1 | 2 |\n      | 3 | 4 |\n';

    const document = parse(source);
    const ids1 = IdGenerator.incrementing();
    const ids2 = IdGenerator.incrementing();
    expect(compilePickles(document, 'f.feature', ids1, new GherkinBudget())).toEqual(
      compile(document, 'f.feature', ids2),
    );
  });

  test('Example values are inserted once, and never scanned again.', () => {
    expect(stepTexts(outline(['a', 'b'], ['<b><b>', 'x']))).toEqual(['<b><b>.']);
    expect(stepTexts(outline(['a'], ['<a>']))).toEqual(['<a>.']);
    expect(stepTexts(outline(['a'], ['$& $1 $$']))).toEqual(['$& $1 $$.']);
  });

  test('The longest token wins.', () => {
    expect(stepTexts(outline(['x', 'x>y'], ['1', '2'], 'Given <x>y>.'))).toEqual(['2.']);
  });

  test('Duplicate columns, and too many columns, are rejected.', () => {
    expect(() => stepTexts(outline(['a', 'a'], ['1', '2']))).toThrow('the column "a" more than once');

    const headers = Array.from({ length: MAX_EXAMPLE_COLUMNS + 1 }, (_, i) => `c${i}`);
    expect(() => stepTexts(outline(headers, headers))).toThrow('256 column limit');
  });

  test('The text created from the examples is limited.', () => {
    // 2 Mi characters, 10 times each in 1 step, gives 20 Mi characters.
    const big = 'x'.repeat(2 * 1024 * 1024);
    const document = parse(outline(['a'], ['v'], 'Given ' + '<a>'.repeat(10) + '.'));
    document.feature!.children[0].scenario!.examples[0].tableBody[0].cells[0].value = big;
    expect(() => compilePickles(document, 'f.feature', IdGenerator.incrementing(), new GherkinBudget())).toThrow(
      '16 Mi character limit',
    );
  });

  test('The number of generated items is limited.', () => {
    const budget = new GherkinBudget();
    expect(() => {
      for (let i = 0; i <= 100000; i++) budget.item();
    }).toThrow('100000 generated item limit');
  });

  test('Rules are rejected.', () => {
    const document = parse('Feature: F\n\n  Rule: R\n\n    Scenario: S\n      Given G.\n');
    expect(() => compilePickles(document, 'f.feature', IdGenerator.incrementing(), new GherkinBudget())).toThrow(
      'Rules are not supported',
    );
  });
});

describe('Report file', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(join(realpathSync(tmpdir()), 'easy-bdd-output-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('Writes the lines, creating the directories, and leaves no temporary files.', async () => {
    const path = join(dir, 'a', 'b', 'results.ndjson');
    await writeOutput(path, ['{"x":1}', '{"y":"ç"}']);
    expect(await fs.readFile(path, 'utf-8')).toBe('{"x":1}\n{"y":"ç"}\n');
    expect(await fs.readdir(join(dir, 'a', 'b'))).toEqual(['results.ndjson']);
  });

  test('Never overwrites an existing file.', async () => {
    const path = join(dir, 'results.ndjson');
    await fs.writeFile(path, 'old');
    await expect(writeOutput(path, ['new'])).rejects.toThrow('already exists');
    expect(await fs.readFile(path, 'utf-8')).toBe('old');
  });

  test('An error while writing leaves no file behind.', async () => {
    const path = join(dir, 'results.ndjson');
    function* lines() {
      yield 'first';
      throw new Error('Boom.');
    }
    await expect(writeOutput(path, lines())).rejects.toThrow('Boom.');
    expect(await fs.readdir(dir)).toEqual([]);
  });

  test('invalidateOutput deletes an old report, and only a regular file.', async () => {
    const path = join(dir, 'results.ndjson');
    await invalidateOutput(path); // Nothing to delete.
    await fs.writeFile(path, 'old');
    await invalidateOutput(path);
    await expect(fs.access(path)).rejects.toThrow();

    await fs.mkdir(path);
    await expect(invalidateOutput(path)).rejects.toThrow('not a regular file');
  });

  test('Rejects a link in the path.', async () => {
    const target = join(dir, 'target');
    const link = join(dir, 'link');
    await fs.mkdir(target);
    await fs.symlink(target, link, 'junction');

    await expect(writeOutput(join(link, 'results.ndjson'), ['x'])).rejects.toThrow('is a link');
    await expect(invalidateOutput(join(link, 'results.ndjson'))).rejects.toThrow('is a link');
    expect(await fs.readdir(target)).toEqual([]);
  });
});

describe('Recorded data', () => {
  let dir: string;
  const testPath = join(realpathSync(tmpdir()), 'some.test.ts');

  beforeEach(async () => {
    dir = await fs.mkdtemp(join(realpathSync(tmpdir()), 'easy-bdd-data-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  async function record(events: RunEvent[], fileName = 'a.ndjson'): Promise<void> {
    const lines = [{ type: 'file', version: RUN_DATA_VERSION, testPath } as RunEvent, ...events];
    await fs.writeFile(join(dir, fileName), lines.map(line => JSON.stringify(line) + '\n').join(''));
  }

  const declared: RunEvent[] = [
    { type: 'feature', title: 'F', header: 'Feature: F\n', background: null },
    {
      type: 'bdd',
      bdd: 0,
      feature: 'F',
      scenario: '  Scenario: S\n    Given G.\n',
      steps: [{ hook: false, codes: [0] }],
      codeCount: 1,
      tests: ['1 S'],
      hasExamples: false,
      skip: false,
      only: false,
    },
  ];

  const started: RunEvent = { type: 'start', bdd: 0, test: 0, attempt: 1, startedAt: 1000 };
  const failedCode: RunEvent = {
    type: 'code',
    bdd: 0,
    test: 0,
    attempt: 1,
    code: 0,
    startedAt: 1000,
    duration: 1,
    error: { type: 'Error', message: 'Boom.' },
  };
  const failedEnd: RunEvent = {
    type: 'end',
    bdd: 0,
    test: 0,
    attempt: 1,
    duration: 1,
    error: { type: 'Error', message: 'Boom.' },
  };

  function jest(status: string | null, testExecError?: string): JestResults {
    return {
      testResults: [
        {
          testFilePath: testPath,
          testExecError: testExecError ? { message: testExecError } : undefined,
          testResults: status ? [{ title: '1 S', status, failureMessages: [] }] : [],
        },
      ],
    };
  }

  async function problemsOf(events: RunEvent[], jestResults: JestResults): Promise<string[]> {
    await record(events);
    return (await readRunResults(dir, jestResults)).problems;
  }

  test('Consistent data has no problems.', async () => {
    expect(await problemsOf([...declared, started, failedCode, failedEnd], jest('failed'))).toEqual([]);
  });

  test('Jest says it passed, but the BDD failed.', async () => {
    expect(await problemsOf([...declared, started, failedCode, failedEnd], jest('passed'))).toEqual([
      expect.stringContaining('passed, but its last recorded attempt didn\'t pass'),
    ]);
  });

  test('Jest says it passed, but the BDD never finished.', async () => {
    expect(await problemsOf([...declared, started], jest('passed'))).toEqual([
      expect.stringContaining('passed, but its last recorded attempt didn\'t pass'),
    ]);
  });

  test('Jest has no result for a BDD that ran.', async () => {
    expect(await problemsOf([...declared, started, failedCode, failedEnd], jest(null))).toEqual([
      expect.stringContaining('Jest has no result for "1 S"'),
    ]);
  });

  test('The test file failed to run.', async () => {
    expect(await problemsOf([...declared], jest(null, 'Syntax error.'))).toEqual([
      expect.stringContaining('failed to run: Syntax error.'),
    ]);
  });

  test('Invalid data.', async () => {
    await fs.writeFile(join(dir, 'a.ndjson'), JSON.stringify({ type: 'file', version: RUN_DATA_VERSION, testPath }) + '\n{bad');
    expect((await readRunResults(dir, jest(null))).problems).toEqual([expect.stringContaining('is not valid JSON')]);

    await fs.writeFile(join(dir, 'a.ndjson'), JSON.stringify({ type: 'file', version: 999, testPath }) + '\n');
    expect((await readRunResults(dir, jest(null))).problems).toEqual([expect.stringContaining('unsupported format')]);
  });

  test('A test that fails before its BDD code runs (like in a beforeEach) is not a problem.', async () => {
    expect(await problemsOf([...declared], jest('failed'))).toEqual([]);
  });

  test('The Cucumber results are not built when there are problems.', async () => {
    await record([...declared, started, failedCode, failedEnd]);
    const results = await readRunResults(dir, jest('passed'));
    expect(() => buildCucumberMessages(results, { runId: 'r', success: true })).toThrow(
      "The BDD results can't be verified",
    );
  });
});

describe('Cucumber Messages', () => {
  function results(header: string, scenarios: string[], conflicts: string[] = []): RunResults {
    return {
      problems: [],
      features: [
        {
          title: 'F',
          header,
          background: null,
          conflicts,
          bdds: scenarios.map((scenario, id) => ({
            testPath: 'a.test.ts',
            id,
            feature: 'F',
            scenario,
            steps: [{ hook: false, codes: [] }],
            codeCount: 0,
            skip: false,
            only: false,
            tests: [{ name: `${id + 1} S`, exampleIndex: null, attempts: [], jestStatus: 'skipped', jestFailureMessages: [] }],
          })),
        },
      ],
    };
  }

  test('A BDD without a scenario is rejected.', () => {
    expect(() => buildCucumberMessages(results('Feature: F\n', ['    Given G.\n']), { runId: 'r', success: true })).toThrow(
      'Every BDD must have a scenario',
    );
  });

  test('A feature with a different description in another test file is rejected.', () => {
    expect(() =>
      buildCucumberMessages(results('Feature: F\n', ['  Scenario: S\n    Given G.\n'], ['b.test.ts']), {
        runId: 'r',
        success: true,
      }),
    ).toThrow('its description or Background is different in b.test.ts');
  });

  test('A BDD whose steps don\'t match the Gherkin is rejected.', () => {
    expect(() =>
      buildCucumberMessages(results('Feature: F\n', ['  Scenario: S\n    Given G.\n    Then T.\n']), {
        runId: 'r',
        success: true,
      }),
    ).toThrow("1 BDD steps don't match 2 Gherkin steps");
  });

  test('A BDD that didn\'t run has all its steps skipped, and every message is valid JSON.', () => {
    const envelopes = buildCucumberMessages(results('Feature: F\n', ['  Scenario: S\n    Given G.\n']), {
      runId: 'run',
      success: true,
    });
    const roundTrip = envelopes.map(envelope => JSON.parse(JSON.stringify(envelope)));
    expect(roundTrip).toEqual(envelopes);
    expect(envelopes.map(envelope => Object.keys(envelope)[0])).toEqual([
      'meta',
      'source',
      'gherkinDocument',
      'pickle',
      'testRunStarted',
      'testCase',
      'testCaseStarted',
      'testStepStarted',
      'testStepFinished',
      'testCaseFinished',
      'testRunFinished',
    ]);
    expect(envelopes[8].testStepFinished?.testStepResult.status).toBe('SKIPPED');
    expect(envelopes[10].testRunFinished?.success).toBe(true);
  });
});
