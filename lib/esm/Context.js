import { BddError } from './BddError';
/**
 * The context passed to the code of the BDD. It has the values of the current
 * example row (if the BDD has examples), and the values of the tables.
 */
export class Context {
    example;
    _table;
    constructor(example, _table) {
        this.example = example;
        this._table = _table;
    }
    /**
     * The rows of the table with the given name. Example:
     * `ctx.table('notifications').row(0).val('read')`.
     */
    table(tableName) {
        return new TableRows(this._table.row(tableName));
    }
    /** All the tables. */
    get tables() {
        return this._table;
    }
    /** Contexts are equal when they have the same example values and tables. */
    equals(other) {
        return other instanceof Context && this.example.equals(other.example) && this._table.equals(other._table);
    }
}
export class TableRows {
    _values;
    constructor(values) {
        this._values = values;
    }
    /**
     * Example:
     * ctx.table('notifications').row(0).val('read') as boolean;
     */
    row(index) {
        if (index < 0 || index >= this._values.length)
            throw new BddError(`You can't get table row(${index}), since range is 0..${this._values.length}.`);
        else
            return this._values[index];
    }
    /**
     * Return the first row it finds with the given name/value pair. Example:
     * ctx.table('notifications').rowWhere('property', 'lastPrice').val('market') as Money;
     * If no name/value pair is found, an error is thrown.
     */
    rowWhere(name, value) {
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
    get rows() {
        return [...this._values];
    }
    /** Table rows are equal when they have the same rows, with the same values. */
    equals(other) {
        return (other instanceof TableRows &&
            other._values.length === this._values.length &&
            this._values.every((row, i) => row.equals(other._values[i])));
    }
    toString() {
        return `TableRows{${this._values.join(', ')}}`;
    }
}
