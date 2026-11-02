import { TableValues } from './TableValues';
import { BddError } from './BddError';
import type { TableTerm } from './Bdd';

/** The values of all the tables of a BDD, by table name. */
export class MultipleTableValues {
  private readonly _tables: Map<string, TableValues[]>;

  constructor(tables: Map<string, TableValues[]>) {
    this._tables = tables;
  }

  static from(tableTerms: TableTerm[]): MultipleTableValues {
    const _tables: Map<string, TableValues[]> = new Map();
    tableTerms.forEach(_table => {
      const tableValues = _table.rows.map(r => TableValues.from(r.values));
      _tables.set(_table.tableName, tableValues);
    });
    return new MultipleTableValues(_tables);
  }

  /** The rows of the table with the given name. */
  row(tableName: string): TableValues[] {
    const table = this._tables.get(tableName);
    if (table === undefined) throw new BddError(`There is no table named "${tableName}".`);
    return table;
  }

  /** The names of the tables. */
  get tableNames(): string[] {
    return Array.from(this._tables.keys());
  }

  /** Tables are equal when they have the same names, with the same rows and values. */
  equals(other: unknown): boolean {
    if (!(other instanceof MultipleTableValues) || other._tables.size !== this._tables.size) return false;
    return Array.from(this._tables.entries()).every(([name, rows]) => {
      const otherRows = other._tables.get(name);
      return (
        otherRows !== undefined &&
        otherRows.length === rows.length &&
        rows.every((row, i) => row.equals(otherRows[i]))
      );
    });
  }

  toString(): string {
    return Array.from(this._tables.entries())
      .map(([name, rows]) => `${name}: [${rows.join(', ')}]`)
      .join(', ');
  }
}
