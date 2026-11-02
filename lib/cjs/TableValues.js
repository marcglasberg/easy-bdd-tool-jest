"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableValues = void 0;
/**
 * The values of an example row, or of a table row, by column name.
 * Read them with `val(name)`. Example: `ctx.example.val('Price')`.
 */
class TableValues {
    constructor(map) {
        this._map = map;
    }
    static from(exampleRow) {
        const _map = new Map();
        for (const _val of Array.from(exampleRow !== null && exampleRow !== void 0 ? exampleRow : [])) {
            _map.set(_val.name, _val.value);
        }
        return new TableValues(_map);
    }
    /** The value of the given column, or `null` if there is no such column. */
    val(name) {
        var _a;
        return (_a = this._map.get(name)) !== null && _a !== void 0 ? _a : null;
    }
    /** Values are equal when they have the same columns, with the same values (compared with `===`). */
    equals(other) {
        if (!(other instanceof TableValues) || other._map.size !== this._map.size)
            return false;
        return Array.from(this._map.entries()).every(([key, value]) => other._map.has(key) && other._map.get(key) === value);
    }
    toString() {
        return `{${Array.from(this._map.entries())
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(', ')}}`;
    }
}
exports.TableValues = TableValues;
