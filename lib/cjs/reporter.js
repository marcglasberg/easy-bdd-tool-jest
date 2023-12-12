"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporter = void 0;
const BddReporter_1 = require("./BddReporter");
function reporter(r1, r2, r3, r4, r5) {
    BddReporter_1.BddReporter.set(r1, r2, r3, r4, r5);
}
exports.reporter = reporter;
