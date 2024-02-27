import { Config } from "./Config";
export declare function val(name: string, _: any): Val;
export declare class Val {
    name: string;
    value: any;
    constructor(name: string, value: any);
    /**
     * These 3 steps will be applied to format a value in Examples and Tables:
     *
     * 1) If a [Config.transformDescribe] was provided, it will be used to format the value.
     *
     * 2) Next, if the value is null, return 'NULL'.
     *
     * 3) Next, if the value implements the [BddDescribe] interface, or if it has a
     * [describe] method, it will be used to format the value.
     *
     * 4) Last, we'll call the value's [toString] method.
     */
    toString(config?: Config): string;
}
//# sourceMappingURL=val.d.ts.map