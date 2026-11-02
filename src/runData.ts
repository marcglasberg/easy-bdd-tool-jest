// The data each test file records for the `JestReporter`, which runs in Jest's main process.
//
// When the `JestReporter` is used, it creates a temporary directory for the run, and
// puts its path in the RUN_DIR_ENV environment variable before Jest starts the test
// files. Each test file then writes one NDJSON file into that directory, with one
// `RunEvent` per line.

/** The environment variable with the directory where the test files record their BDDs. */
export const RUN_DIR_ENV = 'EASY_BDD_TOOL_JEST_RUN_DIR';

/** The version of the format of the recorded data. */
export const RUN_DATA_VERSION = 1;

/** An error thrown by the code of a BDD. */
export interface ErrorData {
  /** The class of the error, like `Error` or `JestAssertionError`. */
  type: string;
  message: string;
  /** The stack trace, which usually starts with the type and message. */
  stack?: string;
}

/** A Gherkin step of a BDD, and the indexes of its code blocks (see `BddEvent.codeCount`). */
export interface StepData {
  /** True for the hook that runs the callbacks given to `.run()`, which belong to no step. */
  hook: boolean;
  codes: number[];
}

/** The first line of each file. */
export interface FileEvent {
  type: 'file';
  version: number;
  /** The absolute path of the test file. */
  testPath: string;
}

/** A feature. Written again if it changes, and the last one wins. */
export interface FeatureEvent {
  type: 'feature';
  title: string;
  /** The Gherkin text of the feature title and description. */
  header: string;
  /** The Gherkin text of the Background, or `null` if there is none. */
  background: string | null;
}

/** A BDD, written after it's declared, before any of its tests run. */
export interface BddEvent {
  type: 'bdd';
  /** The index of the BDD in the test file. */
  bdd: number;
  feature: string;
  /** The Gherkin text of the BDD: its scenario, steps, tables and examples. */
  scenario: string;
  /** The steps, including the Background steps, and the hook (if any), in order. */
  steps: StepData[];
  /**
   * The number of code blocks, in the order they run: the Background code, the code of
   * the steps, and the callbacks given to `.run()`.
   */
  codeCount: number;
  /** The Jest test names: one for each example row, or a single one if there are no examples. */
  tests: string[];
  /** True if the BDD has examples. */
  hasExamples: boolean;
  skip: boolean;
  only: boolean;
}

/** An attempt of a test started. */
export interface StartEvent {
  type: 'start';
  bdd: number;
  /** The index of the test in `BddEvent.tests`. */
  test: number;
  attempt: number;
  /** Milliseconds since the epoch. */
  startedAt: number;
}

/** A code block finished. */
export interface CodeEvent {
  type: 'code';
  bdd: number;
  test: number;
  attempt: number;
  code: number;
  startedAt: number;
  duration: number;
  error?: ErrorData;
}

/** An attempt of a test finished. */
export interface EndEvent {
  type: 'end';
  bdd: number;
  test: number;
  attempt: number;
  duration: number;
  error?: ErrorData;
}

export type RunEvent = FileEvent | FeatureEvent | BddEvent | StartEvent | CodeEvent | EndEvent;

/** Converts anything thrown into an [ErrorData]. */
export function errorData(error: unknown): ErrorData {
  if (error instanceof Error) {
    return {
      type: error.constructor?.name || error.name || 'Error',
      message: error.message,
      stack: typeof error.stack === 'string' ? error.stack : undefined,
    };
  }
  return { type: error === null ? 'null' : typeof error, message: String(error) };
}
