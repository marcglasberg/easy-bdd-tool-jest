"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFileReporter = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const BddReporter_1 = require("./BddReporter");
class FeatureFileReporter extends BddReporter_1.BddReporter {
    constructor() {
        super();
    }
    report() {
        return __awaiter(this, void 0, void 0, function* () {
            let featureArray = Array.from(this.features);
            for (let i = 0; i < featureArray.length; i++) {
                const feature = featureArray[i];
                let sink = null;
                try {
                    const fileName = this.normalizeFileName(feature.title);
                    const filePath = (0, path_1.join)(this.directory, `${fileName}.feature`);
                    yield fs_1.promises.mkdir(this.directory, { recursive: true });
                    console.log(`Generating ${filePath}`);
                    sink = yield fs_1.promises.open(filePath, 'w');
                    yield sink.writeFile(feature.toString());
                    for (let j = 0; j < feature.testResults.length; j++) {
                        yield this.writeScenario(sink, feature.testResults[j]);
                    }
                }
                catch (e) {
                    console.log('Failed generating feature files!');
                }
                finally {
                    if (sink) {
                        yield sink.close();
                    }
                }
            }
        });
    }
    // Add a bar to the end of dir, only if necessary.
    get directory() {
        return (FeatureFileReporter.dir.endsWith('/') || FeatureFileReporter.dir.endsWith('\\'))
            ? FeatureFileReporter.dir : FeatureFileReporter.dir + '/';
    }
    writeScenario(sink, test) {
        return __awaiter(this, void 0, void 0, function* () {
            yield sink.writeFile('\n');
            const termsArray = Array.from(test.terms);
            for (const term of termsArray) {
                yield sink.writeFile(`${term.toString()}\n`);
            }
        });
    }
}
exports.FeatureFileReporter = FeatureFileReporter;
// Change this to output the results to another dir.
FeatureFileReporter.dir = './gen_features/';
