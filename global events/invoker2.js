var IncGlobal = require('./IncGlobal.js').IncGlobal;

var Invoker2 = function () {
    function Invoker2(){
        this.incGlobal = new IncGlobal();
    }

    Invoker2.prototype.invoke = function() {
        this.incGlobal.incr();
    }

    return Invoker2;
}();

exports.Invoker2 = Invoker2;