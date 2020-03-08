var meGlobal = require('./globalObj.js').getGlobal();

var IncGlobal = function() {
    function IncGlobal(){

    }

    IncGlobal.prototype.incr = function(){
        meGlobal.val++;
        console.log('Incremented to ',meGlobal.val);
    };

    return IncGlobal;
}();

exports.IncGlobal = IncGlobal;
