import { expect, test } from '@jest/globals';
import { Bdd, BDD, Context, Feature, row, val } from '../src';

// Runs real BDDs, and checks what ran, in which order, and what was recorded.
// The last test checks the results, since Jest runs the tests in order.

const log: string[] = [];
const contexts: Context[] = [];

const feature = new Feature('Execution');

feature.background
  .given('The background.')
  .code(ctx => {
    log.push('background');
    contexts.push(ctx);
  })
  .table('background table', row(val('x', 1)));

// 1) The code of the steps runs in order, after the background, and before the .run() callback.
const bdd1: BDD = Bdd(feature);
bdd1
  .scenario('Code runs in order.')
  .given('Given.')
  .code(() => {
    log.push('given');
  })
  .when('When.')
  .code(async () => {
    await Promise.resolve();
    log.push('when');
  })
  .then('Then.')
  .code(() => {
    log.push('then');
  })
  .run(() => {
    log.push('run');
  });

// 2) Examples: one test per example row.
const bdd2: BDD = Bdd(feature);
bdd2
  .scenario('One test per example.')
  .given('The number <n>.')
  .then('It is positive.')
  .example(val('n', 1))
  .example(val('n', 2))
  .run(ctx => {
    log.push(`example ${ctx.example.val('n')}`);
  });

// 3) A scenario may start with When or Then, and .run() may come after Given, When or their code.
const bdd3: BDD = Bdd(feature);
bdd3
  .scenario('Starts with When.')
  .when('When.')
  .code(() => {
    log.push('starts with when');
  })
  .run();

const bdd4: BDD = Bdd(feature);
bdd4.scenario('Ends with Given.').given('Given.').run(() => {
  log.push('ends with given');
});

const bdd5: BDD = Bdd(feature);
bdd5
  .scenario('Ends with Given code.')
  .given('Given.')
  .code(() => {
    log.push('ends with given code');
  })
  .run();

// 4) Skipped BDDs don't run.
Bdd(feature)
  .skip.scenario('Skipped.')
  .given('Given.')
  .run(() => {
    log.push('skipped');
  });

test('Check the results.', () => {
  expect(log).toEqual([
    'background',
    'given',
    'when',
    'then',
    'run',
    'background',
    'example 1',
    'background',
    'example 2',
    'background',
    'starts with when',
    'background',
    'ends with given',
    'background',
    'ends with given code',
  ]);

  // The background tables are available to the code.
  expect(contexts[0].table('background table').row(0).val('x')).toBe(1);
  expect(contexts[0].tables.tableNames).toEqual(['background table']);

  // The .run() callback is not a step.
  expect(bdd1.codeRuns.length).toBe(1);
  expect(Array.from(bdd1.codeTerms).length).toBe(3);

  // One execution per run, with the result of each code block.
  expect(bdd1.executions.length).toBe(1);
  const execution = bdd1.executions[0];
  expect(execution.exampleIndex).toBeNull();
  expect(execution.attempt).toBe(1);
  expect(execution.passed).toBe(true);
  expect(execution.isFinished).toBe(true);
  expect(execution.duration).toBeGreaterThanOrEqual(0);
  expect(execution.startedAt).toBeInstanceOf(Date);

  // Background code, then the 3 steps' code, then the callback.
  expect(execution.codeExecutions.length).toBe(5);
  expect(execution.codeExecutions.every(code => code.passed)).toBe(true);
  expect(execution.codeExecutions[0].codeTerm).toBe(Array.from(feature.backgroundBdd!.codeTerms)[0]);
  const thenCode = Array.from(bdd1.codeTerms)[2];
  expect(execution.resultOf(thenCode)?.passed).toBe(true);
  expect(execution.callbackResults.length).toBe(1);
  expect(execution.callbackResults[0].codeTerm).toBeNull();

  expect(bdd2.executions.map(e => e.exampleIndex)).toEqual([0, 1]);
  expect(bdd2.passed).toEqual([true, true]);
});
