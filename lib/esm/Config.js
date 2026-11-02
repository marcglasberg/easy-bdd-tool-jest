import { Keywords } from './Keywords';
export class Config {
    /** The keywords themselves. */
    keywords;
    /**
     * The [prefix] is after the keywords and before the term.
     * The [suffix] is after the term.
     */
    prefix;
    suffix;
    /**
     * The [keywordPrefix] is before the keyword.
     * The [keywordSuffix] is after the keyword.
     */
    keywordPrefix;
    keywordSuffix;
    indent;
    rightAlignKeywords;
    padChar;
    endOfLineChar;
    tableDivider;
    space;
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
    transformDescribe;
    static _default = new Config({});
    constructor({ keywords = new Keywords({}), prefix = Keywords.empty, suffix = Keywords.empty, keywordPrefix = Keywords.empty, keywordSuffix = Keywords.empty, indent = 2, rightAlignKeywords = false, padChar = ' ', endOfLineChar = '\n', tableDivider = '|', space = ' ', transformDescribe = null, }) {
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
    get spaces() {
        return this.padChar.repeat(this.indent);
    }
}
