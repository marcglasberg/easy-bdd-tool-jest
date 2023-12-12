"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const Keywords_1 = require("./Keywords");
class Config {
    constructor({ keywords = new Keywords_1.Keywords({}), prefix = Keywords_1.Keywords.empty, suffix = Keywords_1.Keywords.empty, keywordPrefix = Keywords_1.Keywords.empty, keywordSuffix = Keywords_1.Keywords.empty, indent = 2, rightAlignKeywords = false, padChar = ' ', endOfLineChar = '\n', tableDivider = '|', space = ' ', transformDescribe = null, }) {
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
exports.Config = Config;
Config._default = new Config({});
