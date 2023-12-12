import { TableRows } from "./Bdd";
export class Context {
    example;
    _table;
    constructor(example, _table) {
        this.example = example;
        this._table = _table;
    }
    table(tableName) {
        return new TableRows(this._table.row(tableName));
    }
}
