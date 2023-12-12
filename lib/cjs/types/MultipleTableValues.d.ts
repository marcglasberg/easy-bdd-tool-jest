import { TableValues } from "./TableValues";
import { TableTerm } from "./Bdd";
export declare class MultipleTableValues {
    private _tables;
    constructor(tables: Map<string, TableValues[]>);
    static from(tableTerms: TableTerm[]): MultipleTableValues;
    row(tableName: string): TableValues[];
    toString(): string;
}
//# sourceMappingURL=MultipleTableValues.d.ts.map