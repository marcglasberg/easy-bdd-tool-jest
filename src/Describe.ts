/**
 * This interface helps to format values in Examples and Tables.
 * If a value implements the [BddDescribe] interface, or if it has a
 * [describe] method, it will be used to format the value.
 */
export interface Describe {
    describe(): any;
}
