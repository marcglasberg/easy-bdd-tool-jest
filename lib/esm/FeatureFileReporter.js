import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { BddReporter } from "./BddReporter";
export class FeatureFileReporter extends BddReporter {
    // Change this to output the results to another dir.
    static dir = './gen_features/';
    constructor() {
        super();
    }
    async report() {
        let featureArray = Array.from(this.features);
        for (let i = 0; i < featureArray.length; i++) {
            const feature = featureArray[i];
            let sink = null;
            try {
                const fileName = this.normalizeFileName(feature.title);
                const filePath = join(this.directory, `${fileName}.feature`);
                await fsPromises.mkdir(this.directory, { recursive: true });
                console.log(`Generating ${filePath}`);
                sink = await fsPromises.open(filePath, 'w');
                await sink.writeFile(feature.toString());
                for (let j = 0; j < feature.testResults.length; j++) {
                    await this.writeScenario(sink, feature.testResults[j]);
                }
            }
            catch (e) {
                console.log('Failed generating feature files!');
            }
            finally {
                if (sink) {
                    await sink.close();
                }
            }
        }
    }
    // Add a bar to the end of dir, only if necessary.
    get directory() {
        return (FeatureFileReporter.dir.endsWith('/') || FeatureFileReporter.dir.endsWith('\\'))
            ? FeatureFileReporter.dir : FeatureFileReporter.dir + '/';
    }
    async writeScenario(sink, test) {
        await sink.writeFile('\n');
        const termsArray = Array.from(test.terms);
        for (const term of termsArray) {
            await sink.writeFile(`${term.toString()}\n`);
        }
    }
}
