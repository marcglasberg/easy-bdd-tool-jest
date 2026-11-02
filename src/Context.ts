import { TableValues } from './TableValues';
import { MultipleTableValues } from './MultipleTableValues';
import { BddError } from './BddError';

/**
 * The context passed to the code of the BDD. It has the values of the current
 * example row (if the BDD has examples), and the values of the tables.
 */
export class Context {
  readonly example: TableValues;
  private readonly _table: MultipleTableValues;

  constructor(example: TableValues, _table: MultipleTableValues) {
    this.example = example;
    this._table = _table;
  }

  /**
   * The rows of the table with the given name. Example:
   * `ctx.table('notifications').row(0).val('read')`.
   */
  table(tableName: string): TableRows {
    return new TableRows(this._table.row(tableName));
  }

  /** All the tables. */
  get tables(): MultipleTableValues {
    return this._table;
  }

  /** Contexts are equal when they have the same example values and tables. */
  equals(other: unknown): boolean {
    return other instanceof Context && this.example.equals(other.example) && this._table.equals(other._table);
  }
}

export class TableRows {
  private readonly _values: TableValues[];

  constructor(values: TableValues[]) {
    this._values = values;
  }

  /**
   * Example:
   * ctx.table('notifications').row(0).val('read') as boolean;
   */
  row(index: number): TableValues {
    if (index < 0 || index >= this._values.length)
      throw new BddError(`You can't get table row(${index}), since range is 0..${this._values.length}.`);
    else return this._values[index];
  }

  /**
   * Return the first row it finds with the given name/value pair. Example:
   * ctx.table('notifications').rowWhere('property', 'lastPrice').val('market') as Money;
   * If no name/value pair is found, an error is thrown.
   */
  rowWhere(name: string, value: unknown): TableValues {
    const foundRow = this._values.find(btv => btv.val(name) === value);

    if (!foundRow) {
      throw new BddError(`There is no table with name:"${name}" and value: "${String(value)}".`);
    }

    return foundRow;
  }

  /**
   * Example:
   * ctx.table('notifications').rows;
   */
  get rows(): TableValues[] {
    return [...this._values];
  }

  /** Table rows are equal when they have the same rows, with the same values. */
  equals(other: unknown): boolean {
    return (
      other instanceof TableRows &&
      other._values.length === this._values.length &&
      this._values.every((row, i) => row.equals(other._values[i]))
    );
  }

  toString(): string {
    return `TableRows{${this._values.join(', ')}}`;
  }
}
