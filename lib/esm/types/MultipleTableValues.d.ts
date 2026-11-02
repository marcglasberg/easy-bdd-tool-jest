import { TableValues } from './TableValues';
import type { TableTerm } from './Bdd';
/** The values of all the tables of a BDD, by table name. */
export declare class MultipleTableValues {
    private readonly _tables;
    constructor(tables: Map<string, TableValues[]>);
    static from(tableTerms: TableTerm[]): MultipleTableValues;
    /** The rows of the table with the given name. */
    row(tableName: string): TableValues[];
    /** The names of the tables. */
    get tableNames(): string[];
    /** Tables are equal when they have the same names, with the same rows and values. */
    equals(other: unknown): boolean;
    toString(): string;
}
//# sourceMappingURL=MultipleTableValues.d.ts.map