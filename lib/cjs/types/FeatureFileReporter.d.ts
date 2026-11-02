import { BddReporter } from './BddReporter';
/**
 * Writes one `.feature` file for each feature, in Gherkin, into the [FeatureFileReporter.dir]
 * directory. The default directory is `./gen_features/`.
 */
export declare class FeatureFileReporter extends BddReporter {
    /** Change this to output the feature files to another directory. Empty means the current directory. */
    static dir: string;
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
    constructor({ clearAllOutputBeforeRun }?: {
        clearAllOutputBeforeRun?: boolean;
    });
    report(): Promise<void>;
    /**
     * The directory, ending with a slash.
     * An empty dir means the current directory (and not the filesystem root).
     */
    get directory(): string;
    private _deleteFeatureFiles;
    private _generate;
}
//# sourceMappingURL=FeatureFileReporter.d.ts.map