var IncGlobal = require('./IncGlobal.js').IncGlobal;

var Invoker1 = function () {
    function Invoker1(){
        this.incGlobal = new IncGlobal();
    }

    Invoker1.prototype.invoke = function() {
        this.incGlobal.incr();
    };
    return Invoker1;
}();

exports.Invoker1 = Invoker1;