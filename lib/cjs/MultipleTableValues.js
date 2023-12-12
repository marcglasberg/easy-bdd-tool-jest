"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipleTableValues = void 0;
const TableValues_1 = require("./TableValues");
const BddError_1 = require("./BddError");
class MultipleTableValues {
    constructor(tables) {
        this._tables = tables;
    }
    static from(tableTerms) {
        let _tables = new Map();
        tableTerms.forEach((_table) => {
            let tableValues = _table.rows.map((r) => TableValues_1.TableValues.from(r.values));
            _tables.set(_table.tableName, tableValues);
        });
        return new MultipleTableValues(_tables);
    }
    row(tableName) {
        const table = this._tables.get(tableName);
        if (table === undefined)
            throw new BddError_1.BddError(`There is no table named "${tableName}".`);
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
exports.MultipleTableValues = MultipleTableValues;
