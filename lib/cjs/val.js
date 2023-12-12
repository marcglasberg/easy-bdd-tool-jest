"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Val = exports.val = void 0;
const Config_1 = require("./Config");
function val(name, _) {
    return new Val(name, _);
}
exports.val = val;
class Val {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    /**
     * These 3 steps will be applied to format a value in Examples and Tables:
     *
     * 1) If a [Config.transformDescribe] was provided, it will be used to format the value.
     *
     * 2) Next, if the value implements the [BddDescribe] interface, or if it has a
     * [describe] method, it will be used to format the value.
     *
     * 3) Last, we'll call the value's [toString] method.
     */
    toString(config = Config_1.Config._default) {
        let _value = this.value;
        // 1)
        if (config.transformDescribe) {
            _value = config.transformDescribe(this.value) || _value;
        }
        // 2)
        if (_value.describe) {
            let description = _value.describe();
            return (description === null) ? 'NULL' : description.toString();
        }
        // 3)
        else
            return (_value === null) ? 'NULL' : _value.toString();
    }
}
exports.Val = Val;
