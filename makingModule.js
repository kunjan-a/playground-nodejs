/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 14/9/12
 * Time: 11:44 AM
 * To change this template use File | Settings | File Templates.
 */
/**
 This function takes a string and replaces all html characters like < > & "
 with the corresponding string literals: &lt; gt; amp; &quot;
 **/
function deentityfy(inputString) {
    var entities = {
        '<':'&lt;',
        '>':'&gt;',
        '&':'&amp;',
        '\'':'&quot;',
        '"':'&dquot;'
    };
    var outputString = '';
    var i;
    for (i = 0; i < inputString.length; i++) {
        var currChar = inputString[i];
        outputString += typeof entities[currChar] === 'undefined' ? currChar : entities[currChar];
    }
    return outputString;
}

var memoizer = function (store, func) {
    function shell(n) {
        if (typeof store[n] !== 'number') {
            store[n] = func(shell,n);
        }
        return store[n];
    }
    return shell;
};

var fibonacci = function (n) {
    var store = [0, 1];

    function fib(n) {
        if (typeof store[n] !== 'number') {
            store[n] = fib(n - 1) + fib(n - 2);
        }
        return store[n];
    }
    return fib(n);
};

var fibonacci1 = memoizer([0, 1], function (shell, n) {
    return shell(n - 1) + shell(n - 2);
});
var factorial1 = memoizer([1], function (shell, n) {
    return n * shell(n - 1);
});

var factorial = function (n) {
    var store = [1];

    function fact(n) {
        if (typeof store[n] !== 'number') {
            store[n] = n * fact(n - 1);
        }
        return store[n];
    }

    return fact(n);
};

function myNew(func){
    var obj = Object.create(func.prototype);
    func.call(obj);
    return obj;
}

var util = require('util');
util.inspect(util);

var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;

function testScope(){
 console.log('Initially ddd is: ');
 console.log(ddd);
 if(array1[4]===56){
  console.log('Truthy, ddd is: ');
    var ddd;
   console.log(ddd);
    }else{
     console.log('falsy, ddd is: ');
     console.log(ddd);
     }
 }

var foo = {
    bar: function () {
        alert(this);
    }
};

foo.bar(); // Reference, OK => foo
(foo.bar)(); // Reference, OK => foo

(foo.bar = foo.bar)(); // global?
(false || foo.bar)(); // global?
(foo.bar, foo.bar)(); // global?

function foo1(bar){
    if( this === global)
        console.log('global is my this');
    else
        console.log(this);
    return !bar && foo1(1);

}

var obj = {
    b:10,
    foo2: function (bar){
        !bar && this.foo2(1);
    }
}

//Don't click "run" until you've decided on what the output should be!

//    Example #1: A simple for loop
    for(var i = 0; i < 5; i++) {
        console.log(i);
    }

//    Example #2: a setTimeout call inside a for loop
    for(var i = 0; i < 5; i++) {
        setTimeout(function() {
            console.log(i);
        }, 100);
    }


//    Making example 2 print 0,1,2,3,4
    for(var i=0; i<5; i++) {
        setTimeout(function(val){
            function clbk(){
                console.log(val);
            }
            return clbk;
        }(i),100);
    }


//    Example #3: Delayed calls a function
var data = [];
for (var i = 0; i < 5; i++) {
    data[i] = function foo() {
        console.log(i);
    };
}data[0](); data[1](); data[2](); data[3](); data[4]();


//    Making example 3 print 0,1,2,3,4
var data = [];
for (var i = 0; i < 5; i++) {
    data[i] = function foo(val) {
        return function(){
            console.log(val);
        }
    }(i);
}data[0](); data[1](); data[2](); data[3](); data[4]();


//    Example #4:
var a = "foo";
function parent() {
    var b = "bar";
};
function nested() {
    console.log(a);
    console.log(b);
};
parent();
nested();


//    Example #5:
var a = [ 'a', 'b', 'c' ];
var b = [ 1, 2, 3 ];
console.log( a.concat(['d', 'e', 'f'], b) );
console.log( a.join('! ') );
console.log( a.slice(1, 3) );
console.log( a.reverse() );
console.log( ' --- ');
var c = a.splice(0, 2);
console.log( a, c );
var d = b.splice(1, 1, 'foo', 'bar');
console.log( b, d );



//    Example #6
function testMe(){
    console.log( doSomething1() );
    console.log( doSomethingElse1() );
    // define the functions after calling them!
    var doSomethingElse1 = function() { return 'doSomethingElse'; };
    function doSomething1() { return 'doSomething'; }
}
// Aaya maza ;)



// CURRY
Function.prototype.curry = function(){
    var that = this;
    var fixedArgs = Array.prototype.slice.call(arguments);
    return function(){
        var argArray = Array.prototype.slice.call(arguments).concat(fixedArgs);
        console.log("Args become:"+argArray);
        return that.apply(this,argArray);
    }
}


