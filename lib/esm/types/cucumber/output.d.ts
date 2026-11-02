/** The largest report file, in bytes of UTF-8. */
export declare const MAX_OUTPUT_BYTES: number;
/**
 * Deletes the report at [path], so that a run that fails, or is interrupted, never leaves an
 * old report that looks current. Does nothing if there is no file. Throws if the path, or one
 * of its parent directories, is a link, or if the path is not a regular file.
 */
export declare function invalidateOutput(path: string): Promise<void>;
/**
 * Writes the [lines] to the file at [path], one per line. The parent directories are created
 * if needed. The report is written to a temporary file in the same directory, and only then
 * renamed into place, so a half-written report is never left behind.
 *
 * Throws if the path, or one of its parent directories, is a link; if a file appears at the
 * path while the report is written; or if the report exceeds [MAX_OUTPUT_BYTES].
 */
export declare function writeOutput(path: string, lines: Iterable<string>): Promise<void>;
//# sourceMappingURL=output.d.ts.map