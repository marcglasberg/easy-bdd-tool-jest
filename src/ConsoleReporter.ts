import {BddReporter} from "./BddReporter";
import {Feature} from "./Feature";

export class ConsoleReporter extends BddReporter {
  public async report(): Promise<void> {
    let output: string = '';

    this.features.forEach((feature: Feature) => {
      if (feature.testResults.length > 0) {
        const featureStr = feature.toString();
        output += featureStr + '\n';

        feature.testResults.forEach(testResult => {
          output += testResult.toString() + '\n';
        });
      }
    });

    process.stdout.write(output);
  }
}
