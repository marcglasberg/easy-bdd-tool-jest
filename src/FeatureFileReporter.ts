import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { BddReporter } from './BddReporter';
import { gherkinSource } from './gherkin';

/**
 * Writes one `.feature` file for each feature, in Gherkin, into the [FeatureFileReporter.dir]
 * directory. The default directory is `./gen_features/`.
 */
export class FeatureFileReporter extends BddReporter {
  /** Change this to output the feature files to another directory. Empty means the current directory. */
  static dir = './gen_features/';

  /**
   * If true, deletes the previously generated feature files before writing the new ones.
   * Only `.feature` files directly inside [FeatureFileReporter.dir] are deleted.
   * Other files, subdirectories and links are kept.
   *
   * Jest runs each test file separately, and each one writes its own feature files.
   * So that a test file doesn't delete the feature files just written by another test
   * file of the same Jest run, only the feature files written before this Jest process
   * started are deleted.
   */
  readonly clearAllOutputBeforeRun: boolean;

  constructor({ clearAllOutputBeforeRun = false }: { clearAllOutputBeforeRun?: boolean } = {}) {
    super();
    this.clearAllOutputBeforeRun = clearAllOutputBeforeRun;
  }

  async report(): Promise<void> {
    if (this.clearAllOutputBeforeRun) await this._deleteFeatureFiles();
    process.stdout.write(`Feature files will be saved in ${this.directory}\n`);
    await this._generate();
    process.stdout.write('Finished.\n');
  }

  /**
   * The directory, ending with a slash.
   * An empty dir means the current directory (and not the filesystem root).
   */
  get directory(): string {
    const dir = FeatureFileReporter.dir;
    if (dir === '') return './';
    return dir.endsWith('/') || dir.endsWith('\\') ? dir : dir + '/';
  }

  private async _deleteFeatureFiles(): Promise<void> {
    const directory = this.directory;
    process.stdout.write(`Deleting previously generated feature files from ${directory}\n`);

    // When this Jest process started. Files written after that belong to the current run.
    const processStart = Date.now() - process.uptime() * 1000;

    let entries;
    try {
      entries = await fsPromises.readdir(directory, { withFileTypes: true });
    } catch (error: any) {
      if (error?.code === 'ENOENT') return;
      process.stdout.write(`Could not delete previously generated feature files: ${error}\n`);
      return;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.feature')) continue;
      const filePath = join(directory, entry.name);
      try {
        const stats = await fsPromises.lstat(filePath);
        if (stats.isFile() && stats.mtimeMs < processStart) await fsPromises.unlink(filePath);
      } catch (error) {
        process.stdout.write(`Could not delete ${filePath}: ${error}\n`);
      }
    }
  }

  private async _generate(): Promise<void> {
    for (const feature of Array.from(this.features)) {
      try {
        const fileName = this.normalizeFileName(feature.title);
        const filePath = join(this.directory, `${fileName}.feature`);
        await fsPromises.mkdir(this.directory, { recursive: true });

        process.stdout.write(`Generating ${filePath}. `);
        await fsPromises.writeFile(filePath, gherkinSource(feature));
        process.stdout.write('Done!\n');
      } catch (error) {
        process.stdout.write(`Failed! Could not generate feature "${feature.title}": ${error}\n`);
      }
    }
  }
}
