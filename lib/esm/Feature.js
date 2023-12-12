import { TestResult } from "./TestResult";
import { Config } from "./Config";
export class Feature {
    title;
    description;
    _bdds;
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
        return this._bdds.map(bdd => new TestResult(bdd));
    }
    add(bdd) {
        this._bdds.push(bdd);
    }
    toString(config = Config._default) {
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
