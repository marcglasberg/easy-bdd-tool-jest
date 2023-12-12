import {BddReporter} from "./BddReporter";

export function reporter(r1?: BddReporter, r2?: BddReporter, r3?: BddReporter, r4?: BddReporter, r5?: BddReporter): void {
    BddReporter.set(r1, r2, r3, r4, r5);
}
