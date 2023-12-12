export class Keywords {
    feature;
    scenario;
    scenarioOutline;
    given;
    when;
    then;
    and;
    but;
    comment;
    examples;
    table;
    static empty = new Keywords({
        feature: '',
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
    });
    constructor({ feature = 'Feature:', scenario = 'Scenario:', scenarioOutline = 'Scenario Outline:', given = 'Given', when = 'When', then = 'Then', and = 'And', but = 'But', comment = '#', examples = 'Examples:', table = '', }) {
        this.feature = feature;
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
    }
}
