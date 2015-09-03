var waterline = require('./es5');
if ('function' === typeof Map) waterline = require('./es6');

module.exports = exports = waterline.default || waterline;
module.exports.init = waterline.init;
