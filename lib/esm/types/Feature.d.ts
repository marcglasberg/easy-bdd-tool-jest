import { BDD } from "./Bdd";
import { TestResult } from "./TestResult";
import { Config } from "./Config";
export declare class Feature {
    readonly title: string;
    readonly description?: string;
    private readonly _bdds;
    constructor(title: string, description?: string);
    get bdds(): BDD[];
    get isEmpty(): boolean;
    get isNotEmpty(): boolean;
    get testResults(): TestResult[];
    add(bdd: BDD): void;
    toString(config?: Config): string;
}
//# sourceMappingURL=Feature.d.ts.map