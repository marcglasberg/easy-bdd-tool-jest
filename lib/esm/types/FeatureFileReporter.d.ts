import { BddReporter } from "./BddReporter";
export declare class FeatureFileReporter extends BddReporter {
    static dir: string;
    constructor();
    report(): Promise<void>;
    private get directory();
    private writeScenario;
}
//# sourceMappingURL=FeatureFileReporter.d.ts.map