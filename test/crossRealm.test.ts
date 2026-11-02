import { describe, expect, test } from '@jest/globals';
import { runInNewContext } from 'vm';
import { Bdd, BddRunner } from '../src';
import { errorData } from '../src/runData';

// Errors may come from another JavaScript realm. For example, Detox creates its errors outside of
// the Jest test environment. They are not `instanceof Error` here, but must be handled as errors.

const makeForeignError: (message: string) => Error = runInNewContext(
  'class DetoxRuntimeError extends Error {}; (message) => new DetoxRuntimeError(message)',
);

describe('Errors from another realm', () => {
  test('They are not instances of this realm\'s Error.', () => {
    expect(makeForeignError('Boom.') instanceof Error).toBe(false);
  });

  test('errorData keeps their type, message and stack.', () => {
    const data = errorData(makeForeignError('Boom.'));
    expect(data.type).toBe('DetoxRuntimeError');
    expect(data.message).toBe('Boom.');
    expect(data.stack).toContain('Boom.');
  });

  test('The internal frames are removed from their stack trace.', () => {
    const bdd = Bdd()
      .scenario('S.')
      .given('G.')
      .then('T.')
      .testRun(() => {
        throw makeForeignError('Boom.');
      });

    const error = bdd.executions[0].error as Error;
    expect(error.stack).toMatch(/BddExecution/);

    BddRunner.removeInternalFrames(error);
    expect(error.stack).toContain('Boom.');
    expect(error.stack).not.toMatch(/BddExecution|BddRunner/);
    expect(error.stack).toContain('crossRealm.test.ts');
  });
});
