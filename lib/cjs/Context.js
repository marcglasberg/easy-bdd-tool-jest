"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const Bdd_1 = require("./Bdd");
class Context {
    constructor(example, _table) {
        this.example = example;
        this._table = _table;
    }
    table(tableName) {
        return new Bdd_1.TableRows(this._table.row(tableName));
    }
}
exports.Context = Context;
