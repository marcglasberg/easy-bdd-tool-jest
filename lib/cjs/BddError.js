"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BddError = void 0;
class BddError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
    }
}
exports.BddError = BddError;
