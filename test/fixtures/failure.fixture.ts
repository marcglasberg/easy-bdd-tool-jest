// Run by test/process.test.ts, in a separate Jest process.
import { Bdd, Feature, reporter } from '../../src';

reporter();

const feature = new Feature('Failures');

Bdd(feature)
  .scenario('Fails in a step.')
  .given('Given.')
  .code(() => {
    throw new Error('Boom in a step.');
  })
  .when('When.')
  .run(() => {
    process.stdout.write('SHOULD NOT RUN\n');
  });

Bdd(feature)
  .scenario('Passes.')
  .given('Given.')
  .run(() => undefined);

Bdd(feature)
  .timeout(100)
  .scenario('Times out.')
  .given('Given.')
  .run(() => new Promise<void>(resolve => setTimeout(resolve, 1000).unref()));
