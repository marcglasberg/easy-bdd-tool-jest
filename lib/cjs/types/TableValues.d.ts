import { Val } from "./val";
export declare class TableValues {
    private _map;
    constructor(map: Map<string, any>);
    static from(exampleRow: Iterable<Val> | null): TableValues;
    val(name: string): any;
    toString(): string;
}
//# sourceMappingURL=TableValues.d.ts.map