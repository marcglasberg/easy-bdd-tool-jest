import { TableValues } from './TableValues';
import { MultipleTableValues } from './MultipleTableValues';
/**
 * The context passed to the code of the BDD. It has the values of the current
 * example row (if the BDD has examples), and the values of the tables.
 */
export declare class Context {
    readonly example: TableValues;
    private readonly _table;
    constructor(example: TableValues, _table: MultipleTableValues);
    /**
     * The rows of the table with the given name. Example:
     * `ctx.table('notifications').row(0).val('read')`.
     */
    table(tableName: string): TableRows;
    /** All the tables. */
    get tables(): MultipleTableValues;
    /** Contexts are equal when they have the same example values and tables. */
    equals(other: unknown): boolean;
}
export declare class TableRows {
    private readonly _values;
    constructor(values: TableValues[]);
    /**
     * Example:
     * ctx.table('notifications').row(0).val('read') as boolean;
     */
    row(index: number): TableValues;
    /**
     * Return the first row it finds with the given name/value pair. Example:
     * ctx.table('notifications').rowWhere('property', 'lastPrice').val('market') as Money;
     * If no name/value pair is found, an error is thrown.
     */
    rowWhere(name: string, value: unknown): TableValues;
    /**
     * Example:
     * ctx.table('notifications').rows;
     */
    get rows(): TableValues[];
    /** Table rows are equal when they have the same rows, with the same values. */
    equals(other: unknown): boolean;
    toString(): string;
}
//# sourceMappingURL=Context.d.ts.map