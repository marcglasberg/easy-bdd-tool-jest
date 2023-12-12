export class BddError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AssertionError';
    }
}
