'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Waterline = require('waterline');

var _Waterline2 = _interopRequireDefault(_Waterline);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _reduce = require('async');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Promise = require('bluebird');

var _Promise2 = _interopRequireDefault(_Promise);

var _merge = require('lodash');

var _get$set$coalesce = require('object-path');

var _pascal = require('change-case');

var METHODS = ['beforeAccess', 'afterAccess', 'beforeSave', 'afterSave', 'beforeUpdate', 'afterUpdate', 'beforeCreate', 'afterCreate', 'beforeDelete', 'afterDelete'];

var passThrough = function passThrough(data) {
  return _Promise2['default'].resolve(data);
};

exports['default'] = function (config) {
  // Instantiate a new instance of the ORM
  var orm = new _Waterline2['default']();

  var schema = _glob2['default'].sync(_path2['default'].join(config.dir, '**/*.js')).map(require).reduce(function (schema, schemata) {
    schema[schemata.identity] = schemata;
    return schema;
  }, {});

  Object.keys(schema).map(getModel).map(function (model) {
    model.lifecycle = getLifecycle(model);

    model = _merge.merge({}, config.defaults, model);

    if (!model.tableName) model.tableName = _pascal.pascalCase(model.identity);
    return model;
  }).filter(function (model) {
    return model['public'] !== false;
  }).map(function (model) {
    return _Waterline2['default'].Collection.extend(model);
  }).map(orm.loadCollection.bind(orm));

  return _Promise2['default'].promisify(orm.initialize.bind(orm))(config).then(function (models) {
    return models.collections;
  });

  function getModel(name) {
    var obj = schema[name];
    if (!obj) throw new Error('Schmemata for model ' + name + ' not found');

    if (obj.base) obj = _merge.merge({}, getModel(obj.base), obj, function (a, b, key) {
      if (~METHODS.indexOf(key) && a && b) {
        if (!Array.isArray(a)) a = [a];
        if (!Array.isArray(b)) b = [b];
        return a.concat(b);
      }
    });

    return obj;
  }

  function getLifecycle(model) {
    return METHODS.reduce(function (prev, method) {
      var fn = _get$set$coalesce.coalesce(model, [method, ['lifecycle', method]], passThrough);
      _get$set$coalesce.set(prev, method, execLifecycle.bind(model, fn));

      // Just in case, delete the original so waterline doesn't also call it
      delete model[method];
      return prev;
    }, {});
  }

  function execLifecycle(lifecycle, instance, req, next) {
    if (!instance) instance = {};
    if (!lifecycle) lifecycle = function () {
      return _Promise2['default'].resolve(instance);
    };
    if (!Array.isArray(lifecycle)) {
      return _Promise2['default'].resolve(lifecycle(instance, req) || instance).nodeify(next);
    }

    return _Promise2['default'].fromNode(function (cb) {
      _reduce.reduce(lifecycle, instance, function (i, mw, cb) {
        _Promise2['default'].resolve(mw(i, req) || instance).nodeify(cb);
      }, cb);
    }).nodeify(next);
  }
};

module.exports = exports['default'];