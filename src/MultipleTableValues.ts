import {TableValues} from "./TableValues";
import {BddError} from "./BddError";
import {TableTerm} from "./Bdd";

export class MultipleTableValues {
    private _tables: Map<string, TableValues[]>;

    constructor(tables: Map<string, TableValues[]>) {
        this._tables = tables;
    }

    static from(tableTerms: TableTerm[]): MultipleTableValues {
        let _tables: Map<string, TableValues[]> = new Map();
        tableTerms.forEach((_table) => {
            let tableValues = _table.rows.map((r) => TableValues.from(r.values));
            _tables.set(_table.tableName, tableValues);
        });
        return new MultipleTableValues(_tables);
    }

    row(tableName: string): TableValues[] {
        const table = this._tables.get(tableName);
        if (table === undefined)
            throw new BddError(`There is no table named "${tableName}".`);
        return table;
    }

    toString(): string {
        let str = '';
        this._tables.forEach((value, key) => {
            str += `${key}: ${JSON.stringify(value)}, `;
        });
        return str;
    }
}
