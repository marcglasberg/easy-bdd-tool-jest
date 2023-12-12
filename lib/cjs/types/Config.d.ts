import { Keywords } from "./Keywords";
export declare class Config {
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
     * Note: If you return `null` the values won't be changed.
     *
     * Example:
     * ```
     * Object? transformDescribe(Object? obj) {
     *   if (obj is User) return obj.userName;
     * }
     * ```
     */
    transformDescribe: ((obj: any) => any) | null;
    static readonly _default: Config;
    constructor({ keywords, prefix, suffix, keywordPrefix, keywordSuffix, indent, rightAlignKeywords, padChar, endOfLineChar, tableDivider, space, transformDescribe, }: {
        keywords?: Keywords | undefined;
        prefix?: Keywords | undefined;
        suffix?: Keywords | undefined;
        keywordPrefix?: Keywords | undefined;
        keywordSuffix?: Keywords | undefined;
        indent?: number | undefined;
        rightAlignKeywords?: boolean | undefined;
        padChar?: string | undefined;
        endOfLineChar?: string | undefined;
        tableDivider?: string | undefined;
        space?: string | undefined;
        transformDescribe?: null | undefined;
    });
    get spaces(): string;
}
//# sourceMappingURL=Config.d.ts.map