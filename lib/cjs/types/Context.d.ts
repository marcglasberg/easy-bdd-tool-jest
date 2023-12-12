import { TableValues } from "./TableValues";
import { MultipleTableValues } from "./MultipleTableValues";
import { TableRows } from "./Bdd";
export declare class Context {
    example: TableValues;
    private _table;
    constructor(example: TableValues, _table: MultipleTableValues);
    table(tableName: string): TableRows;
}
//# sourceMappingURL=Context.d.ts.map