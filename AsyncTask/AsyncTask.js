/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 19/4/13
 * Time: 3:37 PM
 * To change this template use File | Settings | File Templates.
 */
var AsyncTask = function (args, noArgs, task, onSuccess, onFailure) {
    if(noArgs === true){
        this.arguments = [];
    }else{
        if(!(args instanceof Array)){
            this.arguments = [];
            this.arguments.push(args);
        }else{
            this.arguments = args;
        }
    }

    this.task = task;
    this.onSuccess = this.getChangedCallbacks(onSuccess);
    this.onFailure = this.getChangedCallbacks(onFailure);
    this.startTask();
};
exports.AsyncTask = AsyncTask;

AsyncTask.prototype.getChangedCallbacks = function (onSuccess) {
    var self = this;
    if(!onSuccess) {
        return function() {};
    }
    return function () {
        if(!self.isCancelled) {
            onSuccess.apply(self,arguments);
        }
    }
};

AsyncTask.prototype.startTask = function () {
    this.isCancelled = false;
    this.arguments[this.arguments.length++] = this.onSuccess;
    this.arguments[this.arguments.length++] = this.onFailure;
    if(this.task){
        console.log('AsyncTask: Invoking the task');
        this.task.apply(this,this.arguments);
    }
};

AsyncTask.prototype.clearCallback = function () {
    this.isCancelled = true;
};

var asyncOperation = function(time,callback){
    console.log('Inside Async operation');

    setTimeout(function(){
        console.log('Async Operation: Invoking the callback');
        callback();
    },time);
};

var invoke = function(){
    console.log('Inside invoke');
    var onSuccess = function(){
        console.log('Invoked by AsyncTask');
    };
    var time = 5000;
    var asyncTask = new AsyncTask(time,false,asyncOperation);
    setTimeout(function(){
        console.log('Clearing the callback');
        asyncTask.clearCallback();
    },6000);
};

invoke();
