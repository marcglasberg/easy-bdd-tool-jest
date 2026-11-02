import { expect, jest, test } from '@jest/globals';
import { Bdd, BDD, BddReporter, Feature } from '../src';

// With jest.retryTimes(), a failing BDD runs again. Each attempt is recorded.

jest.retryTimes(1);

const feature = new Feature('Retry');
let attempts = 0;

const bdd: BDD = Bdd(feature);
bdd
  .scenario('Fails the first time.')
  .given('Given.')
  .code(() => {
    attempts++;
    if (attempts === 1) throw new Error('First attempt fails.');
  })
  .then('Then.')
  .run();

test('Check the results.', () => {
  expect(attempts).toBe(2);
  expect(bdd.passed).toEqual([false, true]);

  const [first, second] = bdd.executions;
  expect(first.attempt).toBe(1);
  expect(first.passed).toBe(false);
  expect((first.error as Error).message).toBe('First attempt fails.');
  expect(first.codeExecutions[0].passed).toBe(false);
  expect(first.codeExecutions.length).toBe(1); // The callback didn't run.

  expect(second.attempt).toBe(2);
  expect(second.passed).toBe(true);

  // The counters use the last attempt.
  expect(BddReporter.runInfo.passedCount).toBe(1);
  expect(BddReporter.runInfo.failedCount).toBe(0);
});
