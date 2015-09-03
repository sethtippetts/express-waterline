'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Waterline = require('waterline');

var _Waterline2 = _interopRequireDefault(_Waterline);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Promise = require('bluebird');

var _Promise2 = _interopRequireDefault(_Promise);

var _merge = require('lodash');

var _get$set$coalesce = require('object-path');

var _pascal = require('change-case');

var METHODS = ['beforeAccess', 'afterAccess', 'beforeSave', 'afterSave', 'beforeUpdate', 'afterUpdate', 'beforeCreate', 'afterCreate', 'beforeDelete', 'afterDelete'];

exports['default'] = function (models, config) {
  // Instantiate a new instance of the ORM
  var orm = new _Waterline2['default']();

  var schema = _glob2['default'].sync(_path2['default'].join(config.dir, '**/*.js')).map(require).reduce(function (schema, schemata) {
    schema[schemata.identity] = schemata;
    return schema;
  }, {});

  Object.keys(schema).map(getModel).map(function (model) {
    console.log('loading model', model.identity);
    model.lifecycle = getLifecycle(model);

    model = _merge.merge({}, config.defaults, model);

    if (!model.tableName) model.tableName = _pascal.pascalCase(model.identity);
    return model;
  })
  // .filter(model => model.public)
  .map(function (model) {
    return _Waterline2['default'].Collection.extend(model);
  }).map(orm.loadCollection.bind(orm));

  return _Promise2['default'].promisify(orm.initialize.bind(orm))(config).then(function (models) {
    return models.collections;
  }).then(function (modelList) {
    console.log(Object.keys(modelList || {}));
    Object.assign(models, modelList);
    return modelList;
  });

  function getModel(name) {
    var obj = schema[name];
    if (!obj) throw new Error('Schmemata for model ' + name + ' not found');

    if (obj.base) obj = _merge.merge({}, getModel(obj.base), obj);

    return obj;
  }

  function getLifecycle(model) {
    return METHODS.reduce(function (prev, method) {
      var fn = _get$set$coalesce.coalesce(model, [method, ['lifecycle', method]], function (data) {
        return _Promise2['default'].resolve(data);
      });
      _get$set$coalesce.set(prev, method, execLifecycle.bind(model, fn));

      // Just in case, delete the original so waterline doesn't also call it
      delete model[method];
      return prev;
    }, {});
  }

  function execLifecycle(lifecycle, instance, site, user, next) {
    if (!lifecycle) lifecycle = function () {
      return _Promise2['default'].resolve(instance);
    };
    if (!Array.isArray(lifecycle)) lifecycle = [lifecycle];
    return _Promise2['default'].all(lifecycle.map(function (mw) {
      return mw(instance, user, site);
    })).nodeify(next);
  }
};

module.exports = exports['default'];