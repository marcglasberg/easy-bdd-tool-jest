"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporter = reporter;
const BddReporter_1 = require("./BddReporter");
function reporter(r1, r2, r3, r4, r5) {
    BddReporter_1.BddReporter.set(r1, r2, r3, r4, r5);
}
