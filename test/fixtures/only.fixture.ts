// Run by test/process.test.ts, in a separate Jest process.
import { Bdd, Feature, reporter } from '../../src';

// Calling it twice must still print a single summary.
reporter();
reporter();

const feature = new Feature('Only');

Bdd(feature)
  .scenario('Not marked.')
  .given('Given.')
  .run(() => {
    process.stdout.write('RAN NOT MARKED\n');
  });

Bdd(feature)
  .only.scenario('Marked with only.')
  .given('Given.')
  .run(() => {
    process.stdout.write('RAN ONLY\n');
  });

Bdd(feature)
  .skip.scenario('Skipped.')
  .given('Given.')
  .run(() => {
    process.stdout.write('RAN SKIPPED\n');
  });
