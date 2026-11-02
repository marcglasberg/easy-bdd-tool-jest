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
exports.MAX_OUTPUT_BYTES = void 0;
exports.invalidateOutput = invalidateOutput;
exports.writeOutput = writeOutput;
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const path_1 = require("path");
/** The largest report file, in bytes of UTF-8. */
exports.MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
/**
 * Deletes the report at [path], so that a run that fails, or is interrupted, never leaves an
 * old report that looks current. Does nothing if there is no file. Throws if the path, or one
 * of its parent directories, is a link, or if the path is not a regular file.
 */
function invalidateOutput(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const absolute = (0, path_1.resolve)(path);
        yield _rejectLinks(absolute);
        const stats = yield _lstat(absolute);
        if (stats === undefined)
            return;
        if (!stats.isFile())
            throw new Error(`The report path ${absolute} exists, and is not a regular file.`);
        yield fs_1.promises.unlink(absolute);
    });
}
/**
 * Writes the [lines] to the file at [path], one per line. The parent directories are created
 * if needed. The report is written to a temporary file in the same directory, and only then
 * renamed into place, so a half-written report is never left behind.
 *
 * Throws if the path, or one of its parent directories, is a link; if a file appears at the
 * path while the report is written; or if the report exceeds [MAX_OUTPUT_BYTES].
 */
function writeOutput(path, lines) {
    return __awaiter(this, void 0, void 0, function* () {
        const absolute = (0, path_1.resolve)(path);
        yield _rejectLinks(absolute);
        if ((yield _lstat(absolute)) !== undefined) {
            throw new Error(`Cannot write the report: ${absolute} already exists.`);
        }
        const directory = (0, path_1.dirname)(absolute);
        yield fs_1.promises.mkdir(directory, { recursive: true });
        yield _rejectLinks(absolute); // The directories may have been created by someone else.
        const temporary = (0, path_1.resolve)(directory, `.${(0, path_1.basename)(absolute)}.${(0, crypto_1.randomBytes)(8).toString('hex')}.tmp`);
        const file = yield fs_1.promises.open(temporary, 'wx');
        try {
            let bytes = 0;
            let chunk = '';
            for (const line of lines) {
                const text = line + '\n';
                bytes += Buffer.byteLength(text, 'utf-8');
                if (bytes > exports.MAX_OUTPUT_BYTES)
                    throw new Error('The report exceeds the 64 MiB limit.');
                chunk += text;
                if (chunk.length > 1024 * 1024) {
                    yield file.write(chunk, null, 'utf-8');
                    chunk = '';
                }
            }
            if (chunk.length > 0)
                yield file.write(chunk, null, 'utf-8');
            yield file.close();
            // Don't overwrite a file that appeared while the report was written.
            if ((yield _lstat(absolute)) !== undefined) {
                throw new Error(`Cannot write the report: ${absolute} was created while the report was written.`);
            }
            yield fs_1.promises.rename(temporary, absolute);
        }
        catch (error) {
            yield file.close().catch(() => undefined);
            yield fs_1.promises.unlink(temporary).catch(() => undefined);
            throw error;
        }
    });
}
/** Throws if the [absolute] path, or one of its existing parent directories, is a link (or junction). */
function _rejectLinks(absolute) {
    return __awaiter(this, void 0, void 0, function* () {
        const { root } = (0, path_1.parse)(absolute);
        const parts = absolute.substring(root.length).split(path_1.sep).filter(part => part !== '');
        let current = root;
        for (const part of parts) {
            current = current.endsWith(path_1.sep) ? current + part : current + path_1.sep + part;
            const stats = yield _lstat(current);
            if (stats === undefined)
                return;
            if (stats.isSymbolicLink()) {
                throw new Error(`The report path must not contain links, but ${current} is a link. ` +
                    'Use a path without links, for example by resolving it with fs.realpathSync().');
            }
        }
    });
}
function _lstat(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield fs_1.promises.lstat(path);
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) === 'ENOENT')
                return undefined;
            throw error;
        }
    });
}
