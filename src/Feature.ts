import {BDD} from "./Bdd";
import {TestResult} from "./TestResult";
import {Config} from "./Config";

export class Feature {
    readonly title: string;
    readonly description?: string;
    private readonly _bdds: BDD[];

    constructor(title: string, description?: string) {
        this.title = title;
        this.description = description;
        this._bdds = [];
    }

    get bdds(): BDD[] {
        return [...this._bdds];
    }

    get isEmpty(): boolean {
        return this.title.length === 0;
    }

    get isNotEmpty(): boolean {
        return this.title.length > 0;
    }

    get testResults(): TestResult[] {
        return this._bdds.map(bdd => new TestResult(bdd));
    }

    add(bdd: BDD): void {
        this._bdds.push(bdd);
    }

    toString(config: Config = Config._default): string {
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
