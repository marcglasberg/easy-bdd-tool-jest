import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { composeGherkin } from './gherkin';
import { RUN_DATA_VERSION } from './runData';
import type { BddEvent, ErrorData, FeatureEvent, RunEvent, StepData } from './runData';

/** The largest data file of a test file that is read. */
export const MAX_RUN_DATA_BYTES = 64 * 1024 * 1024;

/** The result of one code block, in one attempt. */
export interface CodeResult {
  startedAt: number;
  duration: number;
  error?: ErrorData;
}

/** One attempt of one test. */
export interface AttemptResult {
  attempt: number;
  /** Milliseconds since the epoch. */
  startedAt: number;
  /** False if it never finished (for example, it timed out). */
  finished: boolean;
  duration?: number;
  error?: ErrorData;
  /** The results of the code blocks that finished, by index. */
  codes: Map<number, CodeResult>;
}

/** The final status Jest gave to a test. `missing` means Jest has no result for it. */
export type JestStatus = 'passed' | 'failed' | 'skipped' | 'missing';

/** One Jest test: a BDD without examples, or one example row. */
export interface TestRecord {
  name: string;
  /** The index of the example row, or `null` if the BDD has no examples. */
  exampleIndex: number | null;
  attempts: AttemptResult[];
  jestStatus: JestStatus;
  jestFailureMessages: string[];
}

export interface BddRecord {
  testPath: string;
  id: number;
  feature: string;
  scenario: string;
  steps: StepData[];
  codeCount: number;
  skip: boolean;
  only: boolean;
  tests: TestRecord[];
}

export interface FeatureRecord {
  title: string;
  header: string;
  background: string | null;
  bdds: BddRecord[];
  /** The test files where this feature has a different title, description or background. */
  conflicts: string[];
}

export interface RunResults {
  /** The features of all test files, in the order of the test files (sorted by path). */
  features: FeatureRecord[];
  /**
   * Problems that make the results unverifiable, like recorded data that doesn't match
   * what Jest says. They don't affect the summary or the feature files.
   */
  problems: string[];
}

/** The parts of Jest's results that are used here (see `AggregatedResult` in `@jest/test-result`). */
export interface JestResults {
  testResults: readonly {
    testFilePath: string;
    testExecError?: { message: string } | null;
    testResults: readonly { title: string; status: string; failureMessages: readonly string[] }[];
  }[];
}

/** The Gherkin text of the [feature], with the BDDs of all test files. */
export function featureGherkin(feature: FeatureRecord): string {
  return composeGherkin(
    feature.header,
    feature.background,
    feature.bdds.map(bdd => bdd.scenario),
  );
}

interface _FileData {
  testPath: string;
  features: Map<string, FeatureEvent>;
  bdds: Map<number, { event: BddEvent; tests: TestRecord[] }>;
}

/** Reads the data recorded by the test files into [dir], and matches it with Jest's [results]. */
export async function readRunResults(dir: string, results: JestResults): Promise<RunResults> {
  const problems: string[] = [];
  const files: _FileData[] = [];

  const names = (await fs.readdir(dir)).filter(name => name.endsWith('.ndjson')).sort();
  for (const name of names) {
    const file = await _readFile(join(dir, name), problems);
    if (file) files.push(file);
  }
  files.sort((a, b) => (a.testPath < b.testPath ? -1 : a.testPath > b.testPath ? 1 : 0));

  _matchJestResults(files, results, problems);

  // Merge the features of all test files, by title.
  const features = new Map<string, FeatureRecord>();
  for (const file of files) {
    const bdds = Array.from(file.bdds.values()).sort((a, b) => a.event.bdd - b.event.bdd);
    for (const { event, tests } of bdds) {
      const featureEvent = file.features.get(event.feature);
      if (!featureEvent) {
        problems.push(`The feature of a BDD of ${file.testPath} was not recorded.`);
        continue;
      }
      let feature = features.get(event.feature);
      if (!feature) {
        feature = {
          title: featureEvent.title,
          header: featureEvent.header,
          background: featureEvent.background,
          bdds: [],
          conflicts: [],
        };
        features.set(event.feature, feature);
      } else if (
        (feature.header !== featureEvent.header || feature.background !== featureEvent.background) &&
        !feature.conflicts.includes(file.testPath)
      ) {
        feature.conflicts.push(file.testPath);
      }
      feature.bdds.push({
        testPath: file.testPath,
        id: event.bdd,
        feature: event.feature,
        scenario: event.scenario,
        steps: event.steps,
        codeCount: event.codeCount,
        skip: event.skip,
        only: event.only,
        tests,
      });
    }
  }

  return { features: Array.from(features.values()), problems };
}

async function _readFile(path: string, problems: string[]): Promise<_FileData | undefined> {
  const stats = await fs.lstat(path);
  if (!stats.isFile()) {
    problems.push(`${path} is not a regular file.`);
    return undefined;
  }
  if (stats.size > MAX_RUN_DATA_BYTES) {
    problems.push(`${path} exceeds the 64 MiB limit.`);
    return undefined;
  }

  const lines = (await fs.readFile(path, 'utf-8')).split('\n');
  if (lines[lines.length - 1] === '') lines.pop();

  const data: _FileData = { testPath: '', features: new Map(), bdds: new Map() };
  const attempts = new Map<string, AttemptResult>();

  for (let i = 0; i < lines.length; i++) {
    let event: RunEvent;
    try {
      event = JSON.parse(lines[i]);
    } catch {
      problems.push(`Line ${i + 1} of ${path} is not valid JSON.`);
      return undefined;
    }

    if (i === 0) {
      if (event.type !== 'file' || event.version !== RUN_DATA_VERSION) {
        problems.push(`${path} has an unsupported format.`);
        return undefined;
      }
      if (!event.testPath) {
        problems.push(`${path} doesn't say which test file it belongs to.`);
        return undefined;
      }
      data.testPath = resolve(event.testPath);
      continue;
    }

    switch (event.type) {
      case 'feature':
        data.features.set(event.title, event);
        break;
      case 'bdd':
        data.bdds.set(event.bdd, {
          event,
          tests: event.tests.map((name, index) => ({
            name,
            exampleIndex: event.hasExamples ? index : null,
            attempts: [],
            jestStatus: 'missing',
            jestFailureMessages: [],
          })),
        });
        break;
      case 'start': {
        const test = data.bdds.get(event.bdd)?.tests[event.test];
        if (!test) {
          problems.push(`${path} has a test that started before it was declared.`);
          return undefined;
        }
        const attempt: AttemptResult = {
          attempt: event.attempt,
          startedAt: event.startedAt,
          finished: false,
          codes: new Map(),
        };
        test.attempts.push(attempt);
        attempts.set(`${event.bdd}/${event.test}/${event.attempt}`, attempt);
        break;
      }
      case 'code':
      case 'end': {
        const attempt = attempts.get(`${event.bdd}/${event.test}/${event.attempt}`);
        if (!attempt) {
          problems.push(`${path} has a result of a test that didn't start.`);
          return undefined;
        }
        if (event.type === 'code') {
          attempt.codes.set(event.code, { startedAt: event.startedAt, duration: event.duration, error: event.error });
        } else {
          attempt.finished = true;
          attempt.duration = event.duration;
          attempt.error = event.error;
        }
        break;
      }
      default:
        problems.push(`${path} has an unknown event.`);
        return undefined;
    }
  }

  return data;
}

/** Sets the Jest status of each test, and checks that it agrees with the recorded data. */
function _matchJestResults(files: _FileData[], results: JestResults, problems: string[]): void {
  const jestFiles = new Map(results.testResults.map(result => [resolve(result.testFilePath), result]));

  // The same test file may have more than one data file, if its modules were reset.
  const namesByTestPath = new Map<string, Set<string>>();

  for (const file of files) {
    const jestFile = jestFiles.get(file.testPath);
    if (jestFile?.testExecError) {
      problems.push(`The test file ${file.testPath} failed to run: ${jestFile.testExecError.message}`);
    }

    const names = namesByTestPath.get(file.testPath) ?? new Set<string>();
    namesByTestPath.set(file.testPath, names);

    for (const { tests } of Array.from(file.bdds.values())) {
      for (const test of tests) {
        if (names.has(test.name)) {
          problems.push(`The test file ${file.testPath} has more than one test named "${test.name}".`);
        }
        names.add(test.name);

        const assertions = jestFile?.testResults.filter(result => result.title === test.name) ?? [];
        if (assertions.length > 1) {
          problems.push(`Jest has more than one test named "${test.name}" in ${file.testPath}.`);
        }
        const assertion = assertions[0];
        test.jestStatus = !assertion
          ? 'missing'
          : assertion.status === 'passed'
            ? 'passed'
            : assertion.status === 'failed'
              ? 'failed'
              : 'skipped';
        test.jestFailureMessages = assertion ? [...assertion.failureMessages] : [];

        const last = _lastAttempt(test);
        const where = `"${test.name}" in ${file.testPath}`;
        if (test.jestStatus === 'passed' && !(last?.finished && last.error === undefined)) {
          problems.push(`Jest says ${where} passed, but its last recorded attempt didn't pass.`);
        } else if ((test.jestStatus === 'skipped' || test.jestStatus === 'missing') && last) {
          problems.push(`Jest has no result for ${where}, but it ran.`);
        }
        // A test may fail without running its BDD code, for example when a `beforeEach` fails.
      }
    }
  }
}

function _lastAttempt(test: TestRecord): AttemptResult | undefined {
  return test.attempts.reduce<AttemptResult | undefined>(
    (last, attempt) => (!last || attempt.attempt > last.attempt ? attempt : last),
    undefined,
  );
}

/** The counts of the summary. */
export interface Summary {
  bdds: number;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
}

/** Counts the BDD tests by their Jest status. Tests Jest didn't run (or has no result for) are skipped. */
export function summarize(results: RunResults): Summary {
  const summary: Summary = { bdds: 0, tests: 0, passed: 0, failed: 0, skipped: 0 };
  for (const feature of results.features) {
    for (const bdd of feature.bdds) {
      summary.bdds++;
      for (const test of bdd.tests) {
        summary.tests++;
        if (test.jestStatus === 'passed') summary.passed++;
        else if (test.jestStatus === 'failed') summary.failed++;
        else summary.skipped++;
      }
    }
  }
  return summary;
}
