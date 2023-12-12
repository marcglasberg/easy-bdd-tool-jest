import { BddReporter } from "./BddReporter";
export class ConsoleReporter extends BddReporter {
    async report() {
        let output = '';
        this.features.forEach((feature) => {
            if (feature.testResults.length > 0) {
                const featureStr = feature.toString();
                output += featureStr + '\n';
                feature.testResults.forEach(testResult => {
                    output += testResult.toString() + '\n';
                });
            }
        });
        console.log(output);
    }
}
