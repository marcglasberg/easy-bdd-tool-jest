import { TableValues } from './TableValues';
import { BddError } from './BddError';
/** The values of all the tables of a BDD, by table name. */
export class MultipleTableValues {
    _tables;
    constructor(tables) {
        this._tables = tables;
    }
    static from(tableTerms) {
        const _tables = new Map();
        tableTerms.forEach(_table => {
            const tableValues = _table.rows.map(r => TableValues.from(r.values));
            _tables.set(_table.tableName, tableValues);
        });
        return new MultipleTableValues(_tables);
    }
    /** The rows of the table with the given name. */
    row(tableName) {
        const table = this._tables.get(tableName);
        if (table === undefined)
            throw new BddError(`There is no table named "${tableName}".`);
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
