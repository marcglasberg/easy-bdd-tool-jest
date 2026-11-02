// Run by test/jestReporter.test.ts, in a separate Jest process, with the JestReporter.
import { Bdd, Feature, row, val } from '../../../src';

const feature = new Feature('Stocks', 'Buying and selling.');
feature.background.given('The market is open.').code(() => undefined);

Bdd(feature)
  .scenario('Buying.')
  .given('The user has 100 dollars.')
  .code(() => undefined)
  .when('The user buys 1 IBM.')
  .code(() => undefined)
  .then('The user has 1 IBM.')
  .code(() => undefined)
  .run();

Bdd(feature)
  .scenario('Selling fails.')
  .given('The user has 1 IBM.')
  .code(() => undefined)
  .when('The user sells 2 IBM.')
  .code(() => {
    throw new Error('Cannot sell.');
  })
  .then('The user has no IBM.')
  .code(() => undefined)
  .run();

Bdd(feature)
  .scenario('The number <n>.')
  .given('The number <n>.')
  .note('A note.')
  .then('It is positive.')
  .table('values', row(val('a', 1)))
  .example(val('n', 1))
  .example(val('n', 2))
  .run(ctx => {
    if (ctx.example.val('n') === 2) throw new Error('Two fails.');
  });
