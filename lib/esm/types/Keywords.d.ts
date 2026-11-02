export interface KeywordsFields {
    feature: string;
    background: string;
    scenario: string;
    scenarioOutline: string;
    given: string;
    when: string;
    then: string;
    and: string;
    but: string;
    comment: string;
    examples: string;
    table: string;
    asA: string;
    iWant: string;
    soThat: string;
}
export declare class Keywords implements KeywordsFields {
    feature: string;
    background: string;
    scenario: string;
    scenarioOutline: string;
    given: string;
    when: string;
    then: string;
    and: string;
    but: string;
    comment: string;
    examples: string;
    table: string;
    asA: string;
    iWant: string;
    soThat: string;
    static readonly empty: Keywords;
    /**
     * Keywords where the ones you don't provide are empty, instead of the default keywords.
     * Useful for prefixes and suffixes. Example: `Keywords.only({ scenario: '\n' })`.
     */
    static only(keywords: Partial<KeywordsFields>): Keywords;
    /** The keywords you don't provide are the default Gherkin keywords, like `Given` and `Then`. */
    constructor({ feature, background, scenario, scenarioOutline, given, when, then, and, but, comment, examples, table, asA, iWant, soThat, }: Partial<KeywordsFields>);
}
//# sourceMappingURL=Keywords.d.ts.map