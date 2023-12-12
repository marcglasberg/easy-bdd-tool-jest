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
class ConsoleReporter extends BddReporter_1.BddReporter {
    report() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.ConsoleReporter = ConsoleReporter;
