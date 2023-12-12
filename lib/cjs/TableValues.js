"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableValues = void 0;
class TableValues {
    constructor(map) {
        this._map = map;
    }
    static from(exampleRow) {
        let _map = new Map();
        exampleRow = exampleRow || [];
        // TODO: REMOVE:
        // for (const _val of exampleRow) {
        //     _map.set(_val.name, _val.value);
        // }
        for (const _val of Array.from(exampleRow)) {
            _map.set(_val.name, _val.value);
        }
        return new TableValues(_map);
    }
    val(name) {
        var _a;
        return (_a = this._map.get(name)) !== null && _a !== void 0 ? _a : null;
    }
    toString() {
        return this._map.toString();
    }
}
exports.TableValues = TableValues;
