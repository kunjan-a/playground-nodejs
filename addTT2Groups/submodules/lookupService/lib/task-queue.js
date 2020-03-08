var deferred = require("deferred");

function TaskQueue() {
    this.queue = [];
    this.executing = false;
}

TaskQueue.prototype.submit = function (task) {
    var d = deferred();
    this.queue.push({task:task, d:d});
    this._processQueue();
    return d.promise;
};

TaskQueue.prototype._processQueue = function () {
    var self = this;
    if (self.executing) return;

    var item = self.queue.shift();
    if (item) {
        self.executing = true;
        var result;
        try {
            result = item.task();
        } catch (err) {
            result = err;
        }
        item.d.promise.end(function () {
            //todo: should this be in process.nextTick ?
            self.executing = false;
            process.nextTick(function(){
                self._processQueue();
            });
        });
        item.d.resolve(result);
    }
};

exports.TaskQueue = TaskQueue;

function newGroupTaskQueue() {
    var queues = {};
    return {
        submit:function (groupId, task) {
            var queue = queues[groupId] = queues[groupId] || new TaskQueue();
            return queue.submit(task);
        }
    };
}

exports.newGroupTaskQueue = newGroupTaskQueue;