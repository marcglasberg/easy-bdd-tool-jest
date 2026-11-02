"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_RUNS = exports.MAX_ENVELOPES = void 0;
exports.buildCucumberMessages = buildCucumberMessages;
const gherkin_1 = require("@cucumber/gherkin");
const messages_1 = require("@cucumber/messages");
const os_1 = require("os");
const gherkin_2 = require("../gherkin");
const runResults_1 = require("../runResults");
const pickles_1 = require("./pickles");
/** The most messages a report may have. */
exports.MAX_ENVELOPES = 100000;
/** The most test attempts a report may have. */
exports.MAX_RUNS = 10000;
/**
 * Builds the Cucumber Messages of the [results]: the Gherkin of each feature, its test cases
 * (one per BDD, or per example row), and what happened in each attempt of each test case.
 *
 * Throws if the results can't be reported faithfully, for example if the Gherkin is invalid,
 * if the BDDs don't match their Gherkin scenarios, or if the recorded data doesn't agree with
 * what Jest says. No BDD is silently left out.
 */
function buildCucumberMessages(results, options) {
    return new _MessagesBuilder(results, options).build();
}
class _MessagesBuilder {
    constructor(_results, _options) {
        this._results = _results;
        this._options = _options;
        this._envelopes = [];
        this._budget = new pickles_1.GherkinBudget();
        this._nextId = 0;
        this._id = () => `${this._nextId++}`;
    }
    _add(envelope) {
        if (this._envelopes.length >= exports.MAX_ENVELOPES) {
            throw new Error(`The Cucumber Messages exceed the ${exports.MAX_ENVELOPES} message limit.`);
        }
        this._envelopes.push(envelope);
    }
    build() {
        var _a;
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
                hook: { id: hookId, name: 'run() callback', sourceReference: {}, type: messages_1.HookType.AFTER_TEST_CASE },
            });
        }
        const runs = [];
        for (const plan of plans) {
            for (const attempt of plan.test.attempts) {
                if (runs.length >= exports.MAX_RUNS)
                    throw new Error(`The Cucumber Messages exceed the ${exports.MAX_RUNS} run limit.`);
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
        const finishedAt = Math.max(clock, (_a = this._options.finishedAt) !== null && _a !== void 0 ? _a : Date.now());
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
        var _a, _b, _c, _d;
        if (feature.conflicts.length > 0) {
            throw new Error(`Cannot report feature "${feature.title}": its description or Background is different in ` +
                `${feature.conflicts.join(', ')}.`);
        }
        const uri = `${(0, gherkin_2.featureFileName)(feature.title)}.feature`;
        const source = (0, runResults_1.featureGherkin)(feature);
        if (source.length > pickles_1.MAX_SOURCE_CHARACTERS) {
            throw new Error(`Cannot report feature "${feature.title}": its Gherkin exceeds the 1 Mi character limit.`);
        }
        this._budget.consumeCharacters(source.length);
        const envelopes = (0, gherkin_1.generateMessages)(source, uri, messages_1.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
            includeSource: true,
            includeGherkinDocument: true,
            includePickles: false,
            newId: this._id,
        });
        const errors = envelopes.filter(envelope => envelope.parseError).map(envelope => envelope.parseError.message);
        if (errors.length > 0) {
            throw new Error(`Cannot report feature "${feature.title}": invalid Gherkin (${errors.join('; ')}).`);
        }
        const document = (_a = envelopes.find(envelope => envelope.gherkinDocument)) === null || _a === void 0 ? void 0 : _a.gherkinDocument;
        if (!document)
            throw new Error(`Cannot report feature "${feature.title}": it has no Gherkin document.`);
        if ((_b = document.feature) === null || _b === void 0 ? void 0 : _b.children.some(child => child.rule)) {
            throw new Error(`Cannot report feature "${feature.title}": Gherkin Rules can't be mapped to BDDs.`);
        }
        const pickles = (0, pickles_1.compilePickles)(document, uri, this._id, this._budget);
        envelopes.forEach(envelope => this._add(envelope));
        pickles.forEach(pickle => this._add({ pickle }));
        const scenarios = ((_d = (_c = document.feature) === null || _c === void 0 ? void 0 : _c.children) !== null && _d !== void 0 ? _d : [])
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
        var _a;
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
            const startedAt = Math.max((_a = outcome.startedAt) !== null && _a !== void 0 ? _a : clock, clock);
            const finishedAt = startedAt + outcome.duration;
            clock = finishedAt;
            if (outcome.status === messages_1.TestStepResultStatus.FAILED)
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
            this._addStep(testCaseStartedId, step, { status: messages_1.TestStepResultStatus.SKIPPED, duration: 0 }, at, at);
        }
        this._add({ testCaseFinished: { testCaseStartedId, timestamp: _timestamp(at), willBeRetried: false } });
    }
    _addStep(testCaseStartedId, step, outcome, startedAt, finishedAt) {
        this._add({ testStepStarted: { testCaseStartedId, testStepId: step.testStepId, timestamp: _timestamp(startedAt) } });
        const result = {
            status: outcome.status,
            duration: messages_1.TimeConversion.millisecondsToDuration(outcome.duration),
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
            status: failedBefore || hasCode ? messages_1.TestStepResultStatus.SKIPPED : messages_1.TestStepResultStatus.PASSED,
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
                status: messages_1.TestStepResultStatus.FAILED,
                duration,
                startedAt,
                message: 'The step did not finish. It may have timed out.',
            };
        }
        return {
            status: messages_1.TestStepResultStatus.FAILED,
            duration,
            startedAt,
            error: failure.error,
            message: _errorMessage(failure.error),
        };
    }
    const allRan = step.hook || step.codes.every(code => attempt.codes.has(code));
    return allRan
        ? { status: messages_1.TestStepResultStatus.PASSED, duration, startedAt }
        : { status: messages_1.TestStepResultStatus.SKIPPED, duration: 0 };
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
    return messages_1.TimeConversion.millisecondsSinceEpochToTimestamp(milliseconds);
}
function _meta() {
    return {
        protocolVersion: messages_1.version,
        implementation: { name: 'easy-bdd-tool-jest' },
        runtime: { name: 'node.js', version: process.versions.node },
        os: { name: (0, os_1.platform)(), version: (0, os_1.release)() },
        cpu: { name: (0, os_1.arch)() },
    };
}
