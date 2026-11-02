// Run by test/jestReporter.test.ts, in a separate Jest process, with the JestReporter.
import { jest } from '@jest/globals';
import { Bdd, Feature } from '../../../src';

jest.retryTimes(1);

// The same feature as in a.fixture.ts.
const feature = new Feature('Stocks', 'Buying and selling.');
feature.background.given('The market is open.').code(() => undefined);

Bdd(feature).skip.scenario('Skipped.').given('Given.').run();

Bdd(feature)
  .timeout(200)
  .scenario('Times out.')
  .given('Something slow.')
  .code(() => new Promise<void>(() => undefined))
  .run();

let attempts = 0;
Bdd(feature)
  .scenario('Retried.')
  .given('It fails the first time.')
  .code(() => {
    attempts++;
    if (attempts === 1) throw new Error('First attempt.');
  })
  .run();

Bdd(new Feature('Other'))
  .scenario('Other.')
  .when('Something happens.')
  .then('Something is true.')
  .run();
