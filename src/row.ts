import {Val} from "./val";

export function row(v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val,
                    v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val, v16?: Val): Row {
    return new Row(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16);
}

export class Row {
    values: Val[];

    constructor(
        v1: Val, v2?: Val, v3?: Val, v4?: Val, v5?: Val, v6?: Val, v7?: Val, v8?: Val,
        v9?: Val, v10?: Val, v11?: Val, v12?: Val, v13?: Val, v14?: Val, v15?: Val, v16?: Val,
    ) {
        const values = [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16];
        this.values = values.filter((v): v is Val => v !== undefined && v !== null);
    }
}
