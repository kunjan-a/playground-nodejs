/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 7/9/12
 * Time: 6:25 PM
 * To change this template use File | Settings | File Templates.
 */
Function.prototype.method = function (name, func) {
    this.prototype[name] = func;
    return this;
};