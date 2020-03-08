var TaskQueue = require("../lib/task-queue").TaskQueue;
var deferred = require("deferred");
var Assert = require("assert");
describe("TaskQueue", function () {
    it("a task should not start till the one before it has resolved.", function (done) {

        var firstTaskDome = false;
        var tq = new TaskQueue();
        tq.submit(
            function () {
                var d = deferred();
                setTimeout(function () {
                    firstTaskDome = true;
                    d.resolve();
                }, 10);
                return d.promise;
            }).end();

        tq.submit(function () {
            Assert.ok(firstTaskDome, "Second task started before first completed.");
            done();
        })
            .end();
    });

    it("tasks should execute in order", function (done) {
        var tq = new TaskQueue();
        var count = 0;
        tq.submit(function () {
            count++;
            Assert.equal(count, 1);
        })
            .end();

        tq.submit(function () {
            count++;
            Assert.equal(count, 2);
        })
            .end();

        tq.submit(function () {
            count++;
            Assert.equal(count, 3);
        })
            (function () {
                Assert.equal(count, 3, "All three tasks should finish execution. By the time last task is resolved.");
                done();
            })
            .end();
    });

    it("tasks that throw error, should get resolved by it.", function () {
        var tq = new TaskQueue();
        var error = new Error();

        tq.submit(function () {
            throw error;
        })
            .end(function (actualError) {
                Assert.equal(actualError, error, "Should have received error");
            });
    });

    it("task should execute even if one before it throws error.", function (done) {
        var tq = new TaskQueue();
        var error = new Error();

        tq.submit(function () {
            throw error;
        });

        tq.submit(function () {
            done();
        })
            .end();
    });

    it("should not cause RangeError", function (done) {
        var tq = new TaskQueue();
        var d = deferred();
        tq.submit(function () {
            return d.promise;
        }).end();

        for (var i = 0; i < 2000; i++) {
            tq.submit(function () {
            }).end();
        }

        tq.submit(function () {
            done();
        }).end();

        d.resolve();


    });
});