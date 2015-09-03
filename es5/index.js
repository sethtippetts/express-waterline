'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.init = init;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _getModels = require('./models');

var _getModels2 = _interopRequireDefault(_getModels);

var _router = require('./resource-router');

var _router2 = _interopRequireDefault(_router);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _Promise = require('bluebird');

var _Promise2 = _interopRequireDefault(_Promise);

'use strict';

var initialized;
var configured;
var middleware = function middleware(req, res, next) {
  return res.sendStatus(502);
};
var initPromise = _Promise2['default'].fromNode(function (cb) {
  initialized = cb;
});

exports['default'] = function (name) {
  return initPromise.then(function (collections) {
    if (!name) {
      return collections;
    }
    _assert2['default'](collections[name], 'No collection with name "' + name + '" exists');
    return collections[name];
  });
};

function init(config) {
  _assert2['default'](!configured, 'You can only initialize waterline-models once');

  configured = true;

  config = Object.assign({
    dir: _path2['default'].join(process.cwd(), 'models'),
    defaults: {},
    adapters: {},
    connections: {}
    // Defaults
  }, config);

  var models = {};

  _getModels2['default'](models, config).then(function (models) {
    middleware = _router2['default'](models, config);
    console.log('models', Object.keys(models));
    return models;
  }).nodeify(initialized);

  return function (req, res, next) {
    return middleware(req, res, next);
  };
}