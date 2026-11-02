"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keywords = void 0;
class Keywords {
    /**
     * Keywords where the ones you don't provide are empty, instead of the default keywords.
     * Useful for prefixes and suffixes. Example: `Keywords.only({ scenario: '\n' })`.
     */
    static only(keywords) {
        return new Keywords(Object.assign(Object.assign({}, Keywords.empty), keywords));
    }
    /** The keywords you don't provide are the default Gherkin keywords, like `Given` and `Then`. */
    constructor({ feature = 'Feature:', background = 'Background:', scenario = 'Scenario:', scenarioOutline = 'Scenario Outline:', given = 'Given', when = 'When', then = 'Then', and = 'And', but = 'But', comment = '#', examples = 'Examples:', table = '', asA = 'As a', iWant = 'I want', soThat = 'So that', }) {
        this.feature = feature;
        this.background = background;
        this.scenario = scenario;
        this.scenarioOutline = scenarioOutline;
        this.given = given;
        this.when = when;
        this.then = then;
        this.and = and;
        this.but = but;
        this.comment = comment;
        this.examples = examples;
        this.table = table;
        this.asA = asA;
        this.iWant = iWant;
        this.soThat = soThat;
    }
}
exports.Keywords = Keywords;
Keywords.empty = new Keywords({
    feature: '',
    background: '',
    scenario: '',
    scenarioOutline: '',
    given: '',
    when: '',
    then: '',
    and: '',
    but: '',
    comment: '',
    examples: '',
    table: '',
    asA: '',
    iWant: '',
    soThat: '',
});
