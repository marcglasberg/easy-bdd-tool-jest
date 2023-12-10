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
const Bdd_1 = require("./Bdd");
class ConsoleReporter extends Bdd_1.BddReporter {
    report() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.ConsoleReporter = ConsoleReporter;
