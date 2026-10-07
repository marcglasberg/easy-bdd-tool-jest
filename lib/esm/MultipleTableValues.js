import { TableValues } from "./TableValues";
import { BddError } from "./BddError";
export class MultipleTableValues {
    _tables;
    constructor(tables) {
        this._tables = tables;
    }
    static from(tableTerms) {
        const _tables = new Map();
        tableTerms.forEach((_table) => {
            const tableValues = _table.rows.map((r) => TableValues.from(r.values));
            _tables.set(_table.tableName, tableValues);
        });
        return new MultipleTableValues(_tables);
    }
    row(tableName) {
        const table = this._tables.get(tableName);
        if (table === undefined)
            throw new BddError(`There is no table named "${tableName}".`);
        return table;
    }
    toString() {
        let str = '';
        this._tables.forEach((value, key) => {
            str += `${key}: ${JSON.stringify(value)}, `;
        });
        return str;
    }
}
