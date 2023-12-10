import { BddReporter } from './Bdd';
export class ConsoleReporter extends BddReporter {
    async report() {
        let output = '';
        for (const feature of this.features) {
            if (feature.testResults.length > 0) { // Assuming 'feature' has a 'testResults' property
                const featureStr = feature.toString(); // Assuming 'feature' has a 'toString' method
                output += featureStr + '\n';
            }
            for (const testResult of feature.testResults) {
                output += testResult.toString() + '\n'; // Assuming 'testResult' has a 'toString' method
            }
        }
        console.log(output);
    }
}
