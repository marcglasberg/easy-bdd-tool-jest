import {Val} from "./val";

export class TableValues {
    private _map: Map<string, any>;

    constructor(map: Map<string, any>) {
        this._map = map;
    }

    static from(exampleRow: Iterable<Val> | null): TableValues {
        let _map = new Map<string, any>();
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

    val(name: string): any {
        return this._map.get(name) ?? null;
    }

    toString(): string {
        return this._map.toString();
    }
}

