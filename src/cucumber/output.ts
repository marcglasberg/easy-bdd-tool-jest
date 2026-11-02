import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import { basename, dirname, parse, resolve, sep } from 'path';

/** The largest report file, in bytes of UTF-8. */
export const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

/**
 * Deletes the report at [path], so that a run that fails, or is interrupted, never leaves an
 * old report that looks current. Does nothing if there is no file. Throws if the path, or one
 * of its parent directories, is a link, or if the path is not a regular file.
 */
export async function invalidateOutput(path: string): Promise<void> {
  const absolute = resolve(path);
  await _rejectLinks(absolute);
  const stats = await _lstat(absolute);
  if (stats === undefined) return;
  if (!stats.isFile()) throw new Error(`The report path ${absolute} exists, and is not a regular file.`);
  await fs.unlink(absolute);
}

/**
 * Writes the [lines] to the file at [path], one per line. The parent directories are created
 * if needed. The report is written to a temporary file in the same directory, and only then
 * renamed into place, so a half-written report is never left behind.
 *
 * Throws if the path, or one of its parent directories, is a link; if a file appears at the
 * path while the report is written; or if the report exceeds [MAX_OUTPUT_BYTES].
 */
export async function writeOutput(path: string, lines: Iterable<string>): Promise<void> {
  const absolute = resolve(path);
  await _rejectLinks(absolute);
  if ((await _lstat(absolute)) !== undefined) {
    throw new Error(`Cannot write the report: ${absolute} already exists.`);
  }

  const directory = dirname(absolute);
  await fs.mkdir(directory, { recursive: true });
  await _rejectLinks(absolute); // The directories may have been created by someone else.

  const temporary = resolve(directory, `.${basename(absolute)}.${randomBytes(8).toString('hex')}.tmp`);
  const file = await fs.open(temporary, 'wx');
  try {
    let bytes = 0;
    let chunk = '';
    for (const line of lines) {
      const text = line + '\n';
      bytes += Buffer.byteLength(text, 'utf-8');
      if (bytes > MAX_OUTPUT_BYTES) throw new Error('The report exceeds the 64 MiB limit.');
      chunk += text;
      if (chunk.length > 1024 * 1024) {
        await file.write(chunk, null, 'utf-8');
        chunk = '';
      }
    }
    if (chunk.length > 0) await file.write(chunk, null, 'utf-8');
    await file.close();

    // Don't overwrite a file that appeared while the report was written.
    if ((await _lstat(absolute)) !== undefined) {
      throw new Error(`Cannot write the report: ${absolute} was created while the report was written.`);
    }
    await fs.rename(temporary, absolute);
  } catch (error) {
    await file.close().catch(() => undefined);
    await fs.unlink(temporary).catch(() => undefined);
    throw error;
  }
}

/** Throws if the [absolute] path, or one of its existing parent directories, is a link (or junction). */
async function _rejectLinks(absolute: string): Promise<void> {
  const { root } = parse(absolute);
  const parts = absolute.substring(root.length).split(sep).filter(part => part !== '');
  let current = root;
  for (const part of parts) {
    current = current.endsWith(sep) ? current + part : current + sep + part;
    const stats = await _lstat(current);
    if (stats === undefined) return;
    if (stats.isSymbolicLink()) {
      throw new Error(
        `The report path must not contain links, but ${current} is a link. ` +
          'Use a path without links, for example by resolving it with fs.realpathSync().',
      );
    }
  }
}

async function _lstat(path: string) {
  try {
    return await fs.lstat(path);
  } catch (error: any) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}
