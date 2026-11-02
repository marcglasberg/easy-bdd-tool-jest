import { Keywords } from './Keywords';
export interface ConfigFields {
    keywords: Keywords;
    prefix: Keywords;
    suffix: Keywords;
    keywordPrefix: Keywords;
    keywordSuffix: Keywords;
    indent: number;
    rightAlignKeywords: boolean;
    padChar: string;
    endOfLineChar: string;
    tableDivider: string;
    space: string;
    transformDescribe: ((obj: any) => any) | null;
}
export declare class Config implements ConfigFields {
    /** The keywords themselves. */
    keywords: Keywords;
    /**
     * The [prefix] is after the keywords and before the term.
     * The [suffix] is after the term.
     */
    prefix: Keywords;
    suffix: Keywords;
    /**
     * The [keywordPrefix] is before the keyword.
     * The [keywordSuffix] is after the keyword.
     */
    keywordPrefix: Keywords;
    keywordSuffix: Keywords;
    indent: number;
    rightAlignKeywords: boolean;
    padChar: string;
    endOfLineChar: string;
    tableDivider: string;
    space: string;
    /**
     * In tables and examples the output of values to feature files is done with toString().
     * However, this can be overridden here for your business classes.
     * Note: If you return `null` or `undefined` the values won't be changed.
     *
     * Example:
     * ```
     * transformDescribe: (obj) => (obj instanceof User) ? obj.userName : null
     * ```
     */
    transformDescribe: ((obj: any) => any) | null;
    static readonly _default: Config;
    constructor({ keywords, prefix, suffix, keywordPrefix, keywordSuffix, indent, rightAlignKeywords, padChar, endOfLineChar, tableDivider, space, transformDescribe, }: Partial<ConfigFields>);
    get spaces(): string;
}
//# sourceMappingURL=Config.d.ts.map