"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
const TestResult_1 = require("./TestResult");
const Config_1 = require("./Config");
class Feature {
    constructor(title, description) {
        this.title = title;
        this.description = description;
        this._bdds = [];
    }
    get bdds() {
        return [...this._bdds];
    }
    get isEmpty() {
        return this.title.length === 0;
    }
    get isNotEmpty() {
        return this.title.length > 0;
    }
    get testResults() {
        return this._bdds.map(bdd => new TestResult_1.TestResult(bdd));
    }
    add(bdd) {
        this._bdds.push(bdd);
    }
    toString(config = Config_1.Config._default) {
        let result = config.keywordPrefix.feature +
            config.keywords.feature +
            config.keywordSuffix.feature +
            ' ' +
            config.prefix.feature +
            this.title +
            config.suffix.feature +
            config.endOfLineChar;
        if (this.description) {
            const parts = this.description.trim().split('\n');
            result += config.spaces +
                config.prefix.feature +
                parts.join(config.endOfLineChar + config.spaces) +
                config.suffix.feature +
                config.endOfLineChar;
        }
        return result;
    }
}
exports.Feature = Feature;
