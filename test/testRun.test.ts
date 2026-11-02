import { describe, expect, test } from '@jest/globals';
import { Bdd, BddReporter, Context, Feature, MultipleTableValues, row, TableRows, TableValues, val } from '../src';

// testRun() runs a BDD right away, without declaring a Jest test.

class TestReporter extends BddReporter {
  async report(): Promise<void> {}
}

describe('testRun', () => {
  test('Runs the code, and records that it passed.', () => {
    const log: string[] = [];
    const reporter = new TestReporter();
    const feature = new Feature('F');
    feature.background.given('Background.').code(() => {
      log.push('background');
    });

    const bdd = Bdd(feature)
      .scenario('S.')
      .given('G.')
      .code(() => {
        log.push('given');
      })
      .then('T.')
      .testRun(() => {
        log.push('run');
      }, reporter);

    expect(log).toEqual(['background', 'given', 'run']);
    expect(bdd.passed).toEqual([true]);
    expect(bdd.executions[0].passed).toBe(true);
    expect(reporter.features.size).toBe(1);
  });

  test('Records failures.', () => {
    const bdd = Bdd()
      .scenario('S.')
      .given('<n>.')
      .then('T.')
      .example(val('n', 1))
      .example(val('n', 2))
      .testRun(ctx => {
        if (ctx.example.val('n') === 2) throw new Error('Fails for 2.');
      });

    expect(bdd.passed).toEqual([true, false]);
    expect(bdd.executions[1].passed).toBe(false);
    expect((bdd.executions[1].error as Error).message).toBe('Fails for 2.');
  });

  test('A skipped BDD does not run.', () => {
    let ran = false;
    const bdd = Bdd().skip.scenario('S.').given('G.').then('T.').testRun(() => {
      ran = true;
    });
    expect(ran).toBe(false);
    expect(bdd.passed).toEqual([]);
  });
});

describe('Context', () => {
  const tables = MultipleTableValues.from([]);

  test('rowWhere accepts any value, and says what it looked for.', () => {
    const rows = new TableRows([
      TableValues.from([val('name', 'a'), val('n', 1)]),
      TableValues.from([val('name', 'b'), val('n', 2)]),
    ]);
    expect(rows.rowWhere('name', 'b').val('n')).toBe(2);
    expect(rows.rowWhere('n', 1).val('name')).toBe('a');
    expect(() => rows.rowWhere('name', 'c')).toThrow('There is no table with name:"name" and value: "c".');
  });

  test('Equality.', () => {
    const a = TableValues.from([val('x', 1), val('y', 'two')]);
    const b = TableValues.from([val('x', 1), val('y', 'two')]);
    const c = TableValues.from([val('x', 1)]);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);

    expect(new TableRows([a]).equals(new TableRows([b]))).toBe(true);
    expect(new TableRows([a]).equals(new TableRows([c]))).toBe(false);

    expect(new Context(a, tables).equals(new Context(b, tables))).toBe(true);
    expect(new Context(a, tables).equals(new Context(c, tables))).toBe(false);
  });

  test('Tables.', () => {
    const bdd = Bdd();
    bdd.scenario('S.').given('G.').table('t1', row(val('a', 1)), row(val('a', 2)));
    const t1 = MultipleTableValues.from(bdd.tables());
    const t2 = MultipleTableValues.from(bdd.tables());
    expect(t1.equals(t2)).toBe(true);
    expect(t1.equals(tables)).toBe(false);
    expect(t1.tableNames).toEqual(['t1']);
    expect(t1.toString()).toBe('t1: [{a: 1}, {a: 2}]');

    const ctx = new Context(TableValues.from(null), t1);
    expect(ctx.table('t1').rows.length).toBe(2);
    expect(ctx.tables).toBe(t1);
  });
});
