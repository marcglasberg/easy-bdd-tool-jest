import { Val } from './val';
/**
 * The values of an example row, or of a table row, by column name.
 * Read them with `val(name)`. Example: `ctx.example.val('Price')`.
 */
export declare class TableValues {
    private readonly _map;
    constructor(map: Map<string, any>);
    static from(exampleRow: Iterable<Val> | null): TableValues;
    /** The value of the given column, or `null` if there is no such column. */
    val(name: string): any;
    /** Values are equal when they have the same columns, with the same values (compared with `===`). */
    equals(other: unknown): boolean;
    toString(): string;
}
//# sourceMappingURL=TableValues.d.ts.map