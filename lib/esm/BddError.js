export class BddError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
    }
}
