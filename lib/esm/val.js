import { Config } from './Config';
export function val(name, _) {
    return new Val(name, _);
}
export class Val {
    name;
    value;
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    /**
     * These steps will be applied to format a value in Examples and Tables:
     *
     * 1) If a [Config.transformDescribe] was provided, it will be used to format the value.
     *    If it returns `null` or `undefined`, the value is not changed.
     *
     * 2) Next, if the value is `null`, return 'NULL'. If it's `undefined`, return 'undefined'.
     *
     * 3) Next, if the value implements the [Describe] interface (in other words, if it has a
     *    [describe] method), it will be used to format the value.
     *
     * 4) Last, we'll call the value's [toString] method.
     */
    toString(config = Config._default) {
        let _value = this.value;
        // 1)
        if (config.transformDescribe) {
            _value = config.transformDescribe(this.value) ?? _value;
        }
        // 2)
        if (_value === null)
            return 'NULL';
        if (_value === undefined)
            return 'undefined';
        // 3)
        if (typeof _value.describe === 'function') {
            const description = _value.describe();
            return description === null || description === undefined ? 'NULL' : String(description);
        }
        // 4)
        return String(_value);
    }
}
