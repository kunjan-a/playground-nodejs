/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 19/4/13
 * Time: 4:56 PM
 * To change this template use File | Settings | File Templates.
 */

var AsyncTask = function () {
    var AsyncTask = function (args, noArgs, task, onSuccess, onFailure) {
        if (noArgs === true) {
            this.arguments = [];
        } else {
            if (!(args instanceof Array)) {
                this.arguments = [];
                this.arguments.push(args);
            } else {
                this.arguments = args;
            }
        }

        this.task = task;
        this.onSuccess = this.getChangedCallbacks(onSuccess);
        this.onFailure = this.getChangedCallbacks(onFailure);
    };

    AsyncTask.prototype.getChangedCallbacks = function (onSuccess) {
        var self = this;
        if (!onSuccess) {
            return function () {
            };
        }
        return function () {
            if (!self.isCancelled) {
                onSuccess.apply(self, arguments);
            }
        }
    };

    AsyncTask.prototype.startTask = function () {
        this.isCancelled = false;
        this.arguments[this.arguments.length++] = this.onSuccess;
        this.arguments[this.arguments.length++] = this.onFailure;
        this.task.apply(this, this.arguments);
    };

    AsyncTask.prototype.clearCallback = function () {
        this.isCancelled = true;
    };

    return AsyncTask;
}();

exports.AsyncTask = AsyncTask;
