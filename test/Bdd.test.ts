import { afterAll, expect } from '@jest/globals';
import { Bdd, Feature, val } from '../src';

// Smoke test: checks that BDDs run as Jest tests, once per example.

const feature = new Feature('Smoke test');

let runs = 0;

Bdd(feature)
  .scenario('Adding numbers.')
  .given('The number 2.')
  .when('Adding 3.')
  .then('The result is 5.')
  .run(async () => {
    runs++;
    expect(2 + 3).toBe(5);
  });

Bdd(feature)
  .scenario('Multiplying numbers.')
  .given('The number <A>.')
  .when('Multiplying by <B>.')
  .then('The result is <Result>.')
  .example(val('A', 2), val('B', 3), val('Result', 6))
  .example(val('A', 4), val('B', 5), val('Result', 20))
  .run(async ctx => {
    runs++;
    const a: number = ctx.example.val('A');
    const b: number = ctx.example.val('B');
    expect(a * b).toBe(ctx.example.val('Result'));
  });

afterAll(() => {
  // One run for the first scenario, plus one per example of the second.
  expect(runs).toBe(3);
});
