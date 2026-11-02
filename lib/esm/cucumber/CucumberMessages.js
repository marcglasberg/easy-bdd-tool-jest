import { generateMessages } from '@cucumber/gherkin';
import { HookType, SourceMediaType, TestStepResultStatus, TimeConversion, version } from '@cucumber/messages';
import { arch, platform, release } from 'os';
import { featureFileName } from '../gherkin';
import { featureGherkin } from '../runResults';
import { compilePickles, GherkinBudget, MAX_SOURCE_CHARACTERS } from './pickles';
/** The most messages a report may have. */
export const MAX_ENVELOPES = 100000;
/** The most test attempts a report may have. */
export const MAX_RUNS = 10000;
/**
 * Builds the Cucumber Messages of the [results]: the Gherkin of each feature, its test cases
 * (one per BDD, or per example row), and what happened in each attempt of each test case.
 *
 * Throws if the results can't be reported faithfully, for example if the Gherkin is invalid,
 * if the BDDs don't match their Gherkin scenarios, or if the recorded data doesn't agree with
 * what Jest says. No BDD is silently left out.
 */
export function buildCucumberMessages(results, options) {
    return new _MessagesBuilder(results, options).build();
}
class _MessagesBuilder {
    _results;
    _options;
    _envelopes = [];
    _budget = new GherkinBudget();
    _nextId = 0;
    constructor(_results, _options) {
        this._results = _results;
        this._options = _options;
    }
    _id = () => `${this._nextId++}`;
    _add(envelope) {
        if (this._envelopes.length >= MAX_ENVELOPES) {
            throw new Error(`The Cucumber Messages exceed the ${MAX_ENVELOPES} message limit.`);
        }
        this._envelopes.push(envelope);
    }
    build() {
        if (this._results.problems.length > 0) {
            throw new Error(`The BDD results can't be verified:\n- ${this._results.problems.join('\n- ')}`);
        }
        this._add({ meta: _meta() });
        const plans = [];
        for (const feature of this._results.features)
            plans.push(...this._planFeature(feature));
        let hookId;
        if (plans.some(plan => plan.steps.some(step => step.hook))) {
            hookId = this._id();
            this._add({
                hook: { id: hookId, name: 'run() callback', sourceReference: {}, type: HookType.AFTER_TEST_CASE },
            });
        }
        const runs = [];
        for (const plan of plans) {
            for (const attempt of plan.test.attempts) {
                if (runs.length >= MAX_RUNS)
                    throw new Error(`The Cucumber Messages exceed the ${MAX_RUNS} run limit.`);
                runs.push({ plan, attempt });
            }
        }
        runs.sort((a, b) => a.attempt.startedAt - b.attempt.startedAt);
        const testRunStartedId = this._options.runId;
        let clock = runs.length === 0 ? Date.now() : runs[0].attempt.startedAt;
        this._add({ testRunStarted: { id: testRunStartedId, timestamp: _timestamp(clock) } });
        for (const plan of plans) {
            plan.testCaseId = this._id();
            for (const step of plan.steps)
                step.testStepId = this._id();
            this._add({
                testCase: {
                    id: plan.testCaseId,
                    pickleId: plan.pickleId,
                    testRunStartedId,
                    testSteps: plan.steps.map(step => step.hook
                        ? { id: step.testStepId, hookId }
                        : {
                            id: step.testStepId,
                            pickleStepId: step.pickleStepId,
                            stepDefinitionIds: [],
                            stepMatchArgumentsLists: [],
                        }),
                },
            });
        }
        for (const { plan, attempt } of runs) {
            const finishedAt = this._reportRun(plan, attempt, attempt.attempt < plan.lastAttempt);
            if (finishedAt > clock)
                clock = finishedAt;
        }
        // The BDDs that didn't run are reported with all their steps skipped.
        for (const plan of plans.filter(plan => plan.test.attempts.length === 0))
            this._reportSkipped(plan, clock);
        const finishedAt = Math.max(clock, this._options.finishedAt ?? Date.now());
        this._add({
            testRunFinished: {
                success: this._options.success,
                timestamp: _timestamp(finishedAt),
                testRunStartedId,
                message: 'Final result of the complete Jest run, including tests that are not BDDs. ' +
                    'Step details describe the BDD code; setup, teardown and timeout failures may occur outside those steps.',
            },
        });
        return this._envelopes;
    }
    /** Adds the source, Gherkin document and pickles of the [feature], and returns its test cases. */
    _planFeature(feature) {
        if (feature.conflicts.length > 0) {
            throw new Error(`Cannot report feature "${feature.title}": its description or Background is different in ` +
                `${feature.conflicts.join(', ')}.`);
        }
        const uri = `${featureFileName(feature.title)}.feature`;
        const source = featureGherkin(feature);
        if (source.length > MAX_SOURCE_CHARACTERS) {
            throw new Error(`Cannot report feature "${feature.title}": its Gherkin exceeds the 1 Mi character limit.`);
        }
        this._budget.consumeCharacters(source.length);
        const envelopes = generateMessages(source, uri, SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
            includeSource: true,
            includeGherkinDocument: true,
            includePickles: false,
            newId: this._id,
        });
        const errors = envelopes.filter(envelope => envelope.parseError).map(envelope => envelope.parseError.message);
        if (errors.length > 0) {
            throw new Error(`Cannot report feature "${feature.title}": invalid Gherkin (${errors.join('; ')}).`);
        }
        const document = envelopes.find(envelope => envelope.gherkinDocument)?.gherkinDocument;
        if (!document)
            throw new Error(`Cannot report feature "${feature.title}": it has no Gherkin document.`);
        if (document.feature?.children.some(child => child.rule)) {
            throw new Error(`Cannot report feature "${feature.title}": Gherkin Rules can't be mapped to BDDs.`);
        }
        const pickles = compilePickles(document, uri, this._id, this._budget);
        envelopes.forEach(envelope => this._add(envelope));
        pickles.forEach(pickle => this._add({ pickle }));
        const scenarios = (document.feature?.children ?? [])
            .filter(child => child.scenario)
            .map(child => child.scenario);
        const bdds = feature.bdds;
        if (scenarios.length !== bdds.length) {
            throw new Error(`Cannot report feature "${feature.title}": ${bdds.length} BDDs don't match ${scenarios.length} scenarios. ` +
                'Every BDD must have a scenario.');
        }
        const plans = [];
        const mappedPickles = new Set();
        for (let i = 0; i < bdds.length; i++) {
            const bdd = bdds[i];
            const scenario = scenarios[i];
            const rowIds = scenario.examples.flatMap(examples => examples.tableBody.map(row => row.id));
            const scenarioPickles = pickles.filter((pickle) => pickle.astNodeIds[0] === scenario.id);
            const hasExamples = bdd.tests.some(test => test.exampleIndex !== null);
            const exampleCount = hasExamples ? bdd.tests.length : 0;
            if (scenarioPickles.length !== (hasExamples ? exampleCount : 1) || rowIds.length !== exampleCount) {
                throw new Error(`Cannot report scenario "${scenario.name}": its Gherkin examples don't match the BDD examples.`);
            }
            const mappedExamples = new Set();
            for (const pickle of scenarioPickles) {
                if (mappedPickles.has(pickle.id))
                    throw new Error('A Gherkin test case was mapped twice.');
                mappedPickles.add(pickle.id);
                const steps = bdd.steps.map(step => ({ hook: step.hook, codes: step.codes, testStepId: '' }));
                const gherkinSteps = steps.filter(step => !step.hook);
                if (gherkinSteps.length !== pickle.steps.length) {
                    throw new Error(`Cannot report scenario "${scenario.name}": ${gherkinSteps.length} BDD steps don't match ` +
                        `${pickle.steps.length} Gherkin steps.`);
                }
                gherkinSteps.forEach((step, s) => (step.pickleStepId = pickle.steps[s].id));
                const exampleIndex = pickle.astNodeIds.length > 1 ? rowIds.indexOf(pickle.astNodeIds[1]) : null;
                const test = bdd.tests.find(t => t.exampleIndex === exampleIndex);
                if (exampleIndex === -1 || mappedExamples.has(exampleIndex) || !test) {
                    throw new Error(`Cannot report scenario "${scenario.name}": ambiguous example mapping.`);
                }
                mappedExamples.add(exampleIndex);
                plans.push({
                    pickleId: pickle.id,
                    steps,
                    test,
                    lastAttempt: test.attempts.reduce((last, attempt) => Math.max(last, attempt.attempt), 0),
                    testCaseId: '',
                });
            }
        }
        if (mappedPickles.size !== pickles.length) {
            throw new Error(`Cannot report feature "${feature.title}": some Gherkin test cases have no BDD.`);
        }
        return plans;
    }
    /** Adds the messages of one attempt of the [plan]. Returns when it finished. */
    _reportRun(plan, attempt, willBeRetried) {
        const testCaseStartedId = this._id();
        this._add({
            testCaseStarted: {
                id: testCaseStartedId,
                testCaseId: plan.testCaseId,
                attempt: attempt.attempt - 1,
                timestamp: _timestamp(attempt.startedAt),
            },
        });
        let clock = attempt.startedAt;
        let failed = false;
        const running = _runningCode(attempt);
        for (const step of plan.steps) {
            const outcome = _outcomeOf(step, attempt, running, failed);
            const startedAt = Math.max(outcome.startedAt ?? clock, clock);
            const finishedAt = startedAt + outcome.duration;
            clock = finishedAt;
            if (outcome.status === TestStepResultStatus.FAILED)
                failed = true;
            this._addStep(testCaseStartedId, step, outcome, startedAt, finishedAt);
        }
        if (attempt.duration !== undefined)
            clock = Math.max(clock, attempt.startedAt + attempt.duration);
        this._add({
            testCaseFinished: { testCaseStartedId, timestamp: _timestamp(clock), willBeRetried },
        });
        return clock;
    }
    /** Adds the messages of a test case that didn't run, with all its steps skipped. */
    _reportSkipped(plan, at) {
        const testCaseStartedId = this._id();
        this._add({
            testCaseStarted: { id: testCaseStartedId, testCaseId: plan.testCaseId, attempt: 0, timestamp: _timestamp(at) },
        });
        for (const step of plan.steps) {
            this._addStep(testCaseStartedId, step, { status: TestStepResultStatus.SKIPPED, duration: 0 }, at, at);
        }
        this._add({ testCaseFinished: { testCaseStartedId, timestamp: _timestamp(at), willBeRetried: false } });
    }
    _addStep(testCaseStartedId, step, outcome, startedAt, finishedAt) {
        this._add({ testStepStarted: { testCaseStartedId, testStepId: step.testStepId, timestamp: _timestamp(startedAt) } });
        const result = {
            status: outcome.status,
            duration: TimeConversion.millisecondsToDuration(outcome.duration),
            message: outcome.message,
            exception: outcome.error
                ? {
                    type: outcome.error.type,
                    message: outcome.error.message,
                    // Like in other Cucumber implementations, the stack trace starts with the error.
                    stackTrace: outcome.message,
                }
                : undefined,
        };
        this._add({
            testStepFinished: {
                testCaseStartedId,
                testStepId: step.testStepId,
                timestamp: _timestamp(finishedAt),
                testStepResult: result,
            },
        });
    }
}
/**
 * The code block that was running when an attempt that never finished stopped being recorded
 * (for example, because it timed out). The code blocks run in order, so it's the first one
 * without a result. Returns `undefined` if the attempt finished.
 */
function _runningCode(attempt) {
    if (attempt.finished)
        return undefined;
    let index = 0;
    while (attempt.codes.has(index))
        index++;
    return index;
}
/**
 * The result of the [step] in the [attempt]. A step fails if one of its code blocks failed or
 * didn't finish, passes if all of them passed, and is skipped if they didn't run. A step with
 * no code passes, unless a step before it failed.
 */
function _outcomeOf(step, attempt, running, failedBefore) {
    const results = [];
    for (const code of step.codes) {
        const result = attempt.codes.get(code);
        if (result)
            results.push(result);
        else if (code === running)
            results.push('running');
    }
    if (results.length === 0) {
        const hasCode = step.hook || step.codes.length > 0;
        return {
            status: failedBefore || hasCode ? TestStepResultStatus.SKIPPED : TestStepResultStatus.PASSED,
            duration: 0,
        };
    }
    const finished = results.filter((result) => result !== 'running');
    const duration = finished.reduce((total, result) => total + result.duration, 0);
    const startedAt = finished.length > 0 ? finished[0].startedAt : undefined;
    const failure = results.find(result => result === 'running' || result.error !== undefined);
    if (failure !== undefined) {
        if (failure === 'running') {
            return {
                status: TestStepResultStatus.FAILED,
                duration,
                startedAt,
                message: 'The step did not finish. It may have timed out.',
            };
        }
        return {
            status: TestStepResultStatus.FAILED,
            duration,
            startedAt,
            error: failure.error,
            message: _errorMessage(failure.error),
        };
    }
    const allRan = step.hook || step.codes.every(code => attempt.codes.has(code));
    return allRan
        ? { status: TestStepResultStatus.PASSED, duration, startedAt }
        : { status: TestStepResultStatus.SKIPPED, duration: 0 };
}
/** The error message, followed by the stack trace. */
function _errorMessage(error) {
    const stack = error.stack;
    if (stack && stack.includes(error.message))
        return stack;
    const header = `${error.type}: ${error.message}`;
    return stack ? `${header}\n${stack}` : header;
}
function _timestamp(milliseconds) {
    return TimeConversion.millisecondsSinceEpochToTimestamp(milliseconds);
}
function _meta() {
    return {
        protocolVersion: version,
        implementation: { name: 'easy-bdd-tool-jest' },
        runtime: { name: 'node.js', version: process.versions.node },
        os: { name: platform(), version: release() },
        cpu: { name: arch() },
    };
}
