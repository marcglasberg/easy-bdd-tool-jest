"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Row = exports.row = void 0;
function row(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16) {
    return new Row(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16);
}
exports.row = row;
class Row {
    constructor(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16) {
        const values = [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16];
        this.values = values.filter((v) => v !== undefined && v !== null);
    }
}
exports.Row = Row;
