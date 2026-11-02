"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Val = void 0;
exports.val = val;
const Config_1 = require("./Config");
function val(name, _) {
    return new Val(name, _);
}
class Val {
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
    toString(config = Config_1.Config._default) {
        var _a;
        let _value = this.value;
        // 1)
        if (config.transformDescribe) {
            _value = (_a = config.transformDescribe(this.value)) !== null && _a !== void 0 ? _a : _value;
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
exports.Val = Val;
