"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipleTableValues = void 0;
const TableValues_1 = require("./TableValues");
const BddError_1 = require("./BddError");
/** The values of all the tables of a BDD, by table name. */
class MultipleTableValues {
    constructor(tables) {
        this._tables = tables;
    }
    static from(tableTerms) {
        const _tables = new Map();
        tableTerms.forEach(_table => {
            const tableValues = _table.rows.map(r => TableValues_1.TableValues.from(r.values));
            _tables.set(_table.tableName, tableValues);
        });
        return new MultipleTableValues(_tables);
    }
    /** The rows of the table with the given name. */
    row(tableName) {
        const table = this._tables.get(tableName);
        if (table === undefined)
            throw new BddError_1.BddError(`There is no table named "${tableName}".`);
        return table;
    }
    /** The names of the tables. */
    get tableNames() {
        return Array.from(this._tables.keys());
    }
    /** Tables are equal when they have the same names, with the same rows and values. */
    equals(other) {
        if (!(other instanceof MultipleTableValues) || other._tables.size !== this._tables.size)
            return false;
        return Array.from(this._tables.entries()).every(([name, rows]) => {
            const otherRows = other._tables.get(name);
            return (otherRows !== undefined &&
                otherRows.length === rows.length &&
                rows.every((row, i) => row.equals(otherRows[i])));
        });
    }
    toString() {
        return Array.from(this._tables.entries())
            .map(([name, rows]) => `${name}: [${rows.join(', ')}]`)
            .join(', ');
    }
}
exports.MultipleTableValues = MultipleTableValues;
