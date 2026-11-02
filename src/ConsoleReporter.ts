import { BddReporter } from './BddReporter';
import { Config } from './Config';

/** Prints the features and their BDDs to the console, after all tests of the test file run. */
export class ConsoleReporter extends BddReporter {
  static config = new Config({ rightAlignKeywords: true });

  public async report(): Promise<void> {
    const config = ConsoleReporter.config;
    let output = '';
    let count = 0;

    for (const feature of Array.from(this.features)) {
      count++;
      output += `Feature ${count} --------------\n\n`;

      if (feature.isNotEmpty) {
        output += feature.toString(config) + '\n';
        if (feature.hasBackground) output += feature.background.toString(config) + '\n';
      }

      for (const testResult of feature.testResults) {
        output += testResult.toString(config) + '\n';
      }
    }

    process.stdout.write(output);
  }
}
