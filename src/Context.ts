import {TableValues} from "./TableValues";
import {MultipleTableValues} from "./MultipleTableValues";
import {TableRows} from "./Bdd";

export class Context {
    example: TableValues;
    private _table: MultipleTableValues;

    constructor(example: TableValues, _table: MultipleTableValues) {
        this.example = example;
        this._table = _table;
    }

    table(tableName: string): TableRows {
        return new TableRows(this._table.row(tableName));
    }
}
