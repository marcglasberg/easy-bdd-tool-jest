import { describe, expect, test } from '@jest/globals';
import { spawnSync } from 'child_process';
import { join } from 'path';

// Runs the BDDs of a test file in test/fixtures in a separate Jest process,
// and checks its exit code and output.

const root = join(__dirname, '..');

function runJest(fixture: string): { status: number | null; stdout: string; stderr: string } {
  const config = {
    rootDir: root,
    roots: ['<rootDir>/test/fixtures'],
    testMatch: [`**/${fixture}`],
    testEnvironment: 'node',
    transform: { '^.+\\.ts$': 'ts-jest' },
  };
  const result = spawnSync(
    process.execPath,
    [require.resolve('jest/bin/jest'), '--config', JSON.stringify(config), '--ci', '--colors=false'],
    { cwd: root, encoding: 'utf-8', env: { ...process.env, FORCE_COLOR: '0' } },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** The output without the ANSI color codes. */
function plain(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

describe('Separate Jest process', () => {
  test('.only runs only the marked BDD, and the summary counts the others as skipped.', () => {
    const { status, stdout, stderr } = runJest('only.fixture.ts');
    const output = plain(stdout);

    expect(status).toBe(0);
    expect(output).toContain('RAN ONLY');
    expect(output).not.toContain('RAN NOT MARKED');
    expect(output).not.toContain('RAN SKIPPED');
    expect(output).toContain('TEST 2 PASSED!');

    expect(output.match(/RESULTS/g)?.length).toBe(1);
    expect(output).toContain('TOTAL: 3 tests (3 BDDs)\nPASSED: 1 tests\nFAILED: 0 tests\nSKIPPED: 2 tests\n');
    expect(plain(stderr)).toMatch(/Tests:\s+2 skipped, 1 passed, 3 total/);
  }, 60000);

  test('Failures fail the Jest run, and the stack trace has no internal frames.', () => {
    const { status, stdout, stderr } = runJest('failure.fixture.ts');
    const output = plain(stdout);
    const errors = plain(stderr);

    expect(status).toBe(1);
    expect(output).toContain('TEST 1 FAILED!');
    expect(output).not.toContain('SHOULD NOT RUN');
    expect(output).toContain('TEST 2 PASSED!');

    // The test that timed out started, but never finished: it failed.
    expect(output).toContain('TOTAL: 3 tests (3 BDDs)\nPASSED: 1 tests\nFAILED: 2 tests\nSKIPPED: 0 tests\n');

    // The error thrown in the step. (The timeout error that follows has a stack trace
    // that Jest records when the test is declared, so it still has internal frames.)
    const stepError = errors.substring(errors.indexOf('● 1 Fails in a step.'), errors.indexOf('● 3 Times out.'));
    expect(stepError).toContain('Boom in a step.');
    expect(stepError).toContain('at test/fixtures/failure.fixture.ts:12');
    expect(stepError).not.toMatch(/src[\\/](Bdd|BddRunner|BddExecution)\.ts/);
    expect(errors).toMatch(/Tests:\s+2 failed, 1 passed, 3 total/);
  }, 60000);
});
