export class TableValues {
    _map;
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
        return this._map.get(name) ?? null;
    }
    toString() {
        return this._map.toString();
    }
}
