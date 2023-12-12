import {Keywords} from "./Keywords";

export class Config {
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

    static readonly _default = new Config({});

    constructor({
                    keywords = new Keywords({}),
                    prefix = Keywords.empty,
                    suffix = Keywords.empty,
                    keywordPrefix = Keywords.empty,
                    keywordSuffix = Keywords.empty,
                    indent = 2,
                    rightAlignKeywords = false,
                    padChar = ' ',
                    endOfLineChar = '\n',
                    tableDivider = '|',
                    space = ' ',
                    transformDescribe = null,
                }) {
        this.keywords = keywords;
        this.prefix = prefix;
        this.suffix = suffix;
        this.keywordPrefix = keywordPrefix;
        this.keywordSuffix = keywordSuffix;
        this.indent = indent;
        this.rightAlignKeywords = rightAlignKeywords;
        this.padChar = padChar;
        this.endOfLineChar = endOfLineChar;
        this.tableDivider = tableDivider;
        this.space = space;
        this.transformDescribe = transformDescribe;
    }

    get spaces(): string {
        return this.padChar.repeat(this.indent);
    }
}
