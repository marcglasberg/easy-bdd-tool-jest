"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFileReporter = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const BddReporter_1 = require("./BddReporter");
const gherkin_1 = require("./gherkin");
/**
 * Writes one `.feature` file for each feature, in Gherkin, into the [FeatureFileReporter.dir]
 * directory. The default directory is `./gen_features/`.
 */
class FeatureFileReporter extends BddReporter_1.BddReporter {
    constructor({ clearAllOutputBeforeRun = false } = {}) {
        super();
        this.clearAllOutputBeforeRun = clearAllOutputBeforeRun;
    }
    report() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.clearAllOutputBeforeRun)
                yield this._deleteFeatureFiles();
            process.stdout.write(`Feature files will be saved in ${this.directory}\n`);
            yield this._generate();
            process.stdout.write('Finished.\n');
        });
    }
    /**
     * The directory, ending with a slash.
     * An empty dir means the current directory (and not the filesystem root).
     */
    get directory() {
        const dir = FeatureFileReporter.dir;
        if (dir === '')
            return './';
        return dir.endsWith('/') || dir.endsWith('\\') ? dir : dir + '/';
    }
    _deleteFeatureFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = this.directory;
            process.stdout.write(`Deleting previously generated feature files from ${directory}\n`);
            // When this Jest process started. Files written after that belong to the current run.
            const processStart = Date.now() - process.uptime() * 1000;
            let entries;
            try {
                entries = yield fs_1.promises.readdir(directory, { withFileTypes: true });
            }
            catch (error) {
                if ((error === null || error === void 0 ? void 0 : error.code) === 'ENOENT')
                    return;
                process.stdout.write(`Could not delete previously generated feature files: ${error}\n`);
                return;
            }
            for (const entry of entries) {
                if (!entry.isFile() || !entry.name.endsWith('.feature'))
                    continue;
                const filePath = (0, path_1.join)(directory, entry.name);
                try {
                    const stats = yield fs_1.promises.lstat(filePath);
                    if (stats.isFile() && stats.mtimeMs < processStart)
                        yield fs_1.promises.unlink(filePath);
                }
                catch (error) {
                    process.stdout.write(`Could not delete ${filePath}: ${error}\n`);
                }
            }
        });
    }
    _generate() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const feature of Array.from(this.features)) {
                try {
                    const fileName = this.normalizeFileName(feature.title);
                    const filePath = (0, path_1.join)(this.directory, `${fileName}.feature`);
                    yield fs_1.promises.mkdir(this.directory, { recursive: true });
                    process.stdout.write(`Generating ${filePath}. `);
                    yield fs_1.promises.writeFile(filePath, (0, gherkin_1.gherkinSource)(feature));
                    process.stdout.write('Done!\n');
                }
                catch (error) {
                    process.stdout.write(`Failed! Could not generate feature "${feature.title}": ${error}\n`);
                }
            }
        });
    }
}
exports.FeatureFileReporter = FeatureFileReporter;
/** Change this to output the feature files to another directory. Empty means the current directory. */
FeatureFileReporter.dir = './gen_features/';
