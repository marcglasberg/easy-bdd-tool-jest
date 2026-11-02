import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { featureFileName } from './gherkin';
import { RUN_DIR_ENV } from './runData';
import { featureGherkin, readRunResults, summarize } from './runResults';
/**
 * A Jest reporter for the BDDs of all test files of a Jest run. It prints a summary of the
 * results, and may write the feature files and the Cucumber results. Add it to the `reporters`
 * of your Jest configuration (see [JestReporterOptions]).
 *
 * Jest runs each test file separately. This reporter runs in Jest's main process, and sees
 * the BDDs of all test files: while the tests run, each test file records its BDDs and their
 * results in a temporary directory, which the reporter reads after all tests finish.
 */
export class JestReporter {
    _summary;
    _featureDir;
    _clearFeatureFiles;
    _cucumberFile;
    _runDir;
    _cucumberError;
    _lastError;
    constructor(globalConfig, options = {}) {
        const rootDir = globalConfig.rootDir;
        this._summary = options.summary ?? true;
        const featureFiles = options.featureFiles;
        if (featureFiles) {
            const dir = (typeof featureFiles === 'object' && featureFiles.dir) || './gen_features/';
            this._featureDir = resolve(rootDir, dir);
            this._clearFeatureFiles = typeof featureFiles === 'object' && !!featureFiles.clearAllOutputBeforeRun;
        }
        else {
            this._clearFeatureFiles = false;
        }
        const cucumber = options.cucumberResults;
        if (cucumber) {
            const file = (typeof cucumber === 'object' && cucumber.outputFile) || './gen_cucumber_results/results.ndjson';
            this._cucumberFile = resolve(rootDir, file);
        }
    }
    async onRunStart() {
        this._lastError = undefined;
        this._cucumberError = undefined;
        // The test files record their BDDs here. Jest starts the test files after this,
        // so they inherit the environment variable.
        this._runDir = await fs.mkdtemp(join(tmpdir(), 'easy-bdd-tool-jest-'));
        process.env[RUN_DIR_ENV] = this._runDir;
        // An old report must never look like the result of this run.
        if (this._cucumberFile) {
            const { invalidateOutput } = await import('./cucumber/output');
            await invalidateOutput(this._cucumberFile).catch(error => (this._cucumberError = error));
        }
    }
    async onRunComplete(_testContexts, results) {
        const runDir = this._runDir;
        this._runDir = undefined;
        if (process.env[RUN_DIR_ENV] === runDir)
            delete process.env[RUN_DIR_ENV];
        if (!runDir)
            return;
        try {
            if (results.wasInterrupted) {
                process.stdout.write('\nThe run was interrupted. The BDD reports were not written.\n');
                return;
            }
            const runResults = await readRunResults(runDir, results);
            if (runResults.features.length === 0 && runResults.problems.length === 0)
                return;
            if (this._summary)
                this._printSummary(runResults);
            if (this._featureDir)
                await this._writeFeatureFiles(runResults, this._featureDir);
            if (this._cucumberFile)
                await this._writeCucumberResults(runResults, results, this._cucumberFile);
        }
        catch (error) {
            this._lastError = error instanceof Error ? error : new Error(String(error));
            process.stderr.write(`\neasy-bdd-tool-jest: ${this._lastError.message}\n`);
        }
        finally {
            await fs.rm(runDir, { recursive: true, force: true }).catch(() => undefined);
        }
    }
    /** Jest fails the run when a reporter has an error. */
    getLastError() {
        return this._lastError;
    }
    _printSummary(runResults) {
        const summary = summarize(runResults);
        process.stdout.write(`\n${_yellow}` +
            'BDD RESULTS ══════════════════════════════════════════\n' +
            `TOTAL: ${summary.tests} tests (${summary.bdds} BDDs)\n` +
            `PASSED: ${summary.passed} tests\n` +
            `FAILED: ${summary.failed} tests\n` +
            `SKIPPED: ${summary.skipped} tests\n` +
            `══════════════════════════════════════════════════════${_reset}\n\n`);
    }
    async _writeFeatureFiles(runResults, dir) {
        if (this._clearFeatureFiles)
            await _deleteFeatureFiles(dir);
        await fs.mkdir(dir, { recursive: true });
        const written = new Map();
        for (const feature of runResults.features) {
            const fileName = `${featureFileName(feature.title)}.feature`;
            const other = written.get(fileName);
            if (other !== undefined) {
                process.stdout.write(`Warning: The features "${other}" and "${feature.title}" are both written to ${fileName}.\n`);
            }
            if (feature.conflicts.length > 0) {
                process.stdout.write(`Warning: The feature "${feature.title}" has a different description or Background in ` +
                    `${feature.conflicts.join(', ')}. The first one was used.\n`);
            }
            written.set(fileName, feature.title);
            await fs.writeFile(join(dir, fileName), featureGherkin(feature), 'utf-8');
        }
        process.stdout.write(`Feature files saved in ${dir}\n`);
    }
    async _writeCucumberResults(runResults, results, outputFile) {
        if (this._cucumberError !== undefined)
            throw this._cucumberError;
        // Loaded only when used, since it needs the @cucumber packages.
        const { buildCucumberMessages } = await import('./cucumber/CucumberMessages');
        const { writeOutput } = await import('./cucumber/output');
        const success = results.numFailedTests === 0 &&
            results.numRuntimeErrorTestSuites === 0 &&
            !results.snapshot?.failure &&
            !results.runExecError;
        const envelopes = buildCucumberMessages(runResults, { runId: randomBytes(32).toString('hex'), success });
        await writeOutput(outputFile, envelopes.map(envelope => JSON.stringify(envelope)));
        process.stdout.write(`Cucumber results saved in ${outputFile}\n`);
    }
}
/** Deletes only the `.feature` files directly inside the [dir]. Other files, subdirectories and links are kept. */
async function _deleteFeatureFiles(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    }
    catch (error) {
        if (error?.code === 'ENOENT')
            return;
        throw error;
    }
    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.feature'))
            await fs.unlink(join(dir, entry.name));
    }
}
const _yellow = '\x1B[38;5;226m';
const _reset = '\u001b[0m';
export default JestReporter;
