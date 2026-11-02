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
exports.ConsoleReporter = void 0;
const BddReporter_1 = require("./BddReporter");
const Config_1 = require("./Config");
/** Prints the features and their BDDs to the console, after all tests of the test file run. */
class ConsoleReporter extends BddReporter_1.BddReporter {
    report() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = ConsoleReporter.config;
            let output = '';
            let count = 0;
            for (const feature of Array.from(this.features)) {
                count++;
                output += `Feature ${count} --------------\n\n`;
                if (feature.isNotEmpty) {
                    output += feature.toString(config) + '\n';
                    if (feature.hasBackground)
                        output += feature.background.toString(config) + '\n';
                }
                for (const testResult of feature.testResults) {
                    output += testResult.toString(config) + '\n';
                }
            }
            process.stdout.write(output);
        });
    }
}
exports.ConsoleReporter = ConsoleReporter;
ConsoleReporter.config = new Config_1.Config({ rightAlignKeywords: true });
