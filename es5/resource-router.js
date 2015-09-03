'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _set = require('object-path');

var _Promise = require('bluebird');

var _Promise2 = _interopRequireDefault(_Promise);

var _Inflect = require('i');

var _Inflect2 = _interopRequireDefault(_Inflect);

var _queryBuilder = require('./query-builder');

var _queryBuilder2 = _interopRequireDefault(_queryBuilder);

'use strict';

var inflect = new _Inflect2['default']();
var singularize = inflect.singularize.bind(inflect);

exports['default'] = function (models, config) {

  var router = _express2['default'].Router();

  router.use('/:resource', getResource);

  router.route('/:resource').get(list).post(create);

  router.route('/:resource/count').get(count);

  router.route('/:resource/:id').get(get).put(update)['delete'](destroy);

  return router;

  /** Inject model **/
  function getResource(req, res, next) {
    req.model = models[singularize(req.params.resource)];
    next();
  }
};

/*** ---CRUD Methods--- ***/

/** Query resource list **/
function list(req, res, next) {
  var model = req.model;
  var query = req.query;

  _Promise2['default'].resolve(query.filter).then(function (body) {
    return model.lifecycle.beforeAccess(body, req);
  }).then(function (body) {
    return _queryBuilder2['default'](model, body);
  }).then(function (body) {
    return model.lifecycle.afterAccess(body, req);
  }).then(res.send.bind(res))['catch'](next);
}

/** Create new resource **/
function create(req, res, next) {
  var model = req.model;
  var body = req.body;

  _Promise2['default'].resolve(body).then(function (body) {
    return model.lifecycle.beforeSave(body, req);
  }).then(function (body) {
    return model.lifecycle.beforeCreate(body, req);
  }).then(function (body) {
    return model.create(body);
  }).then(function (body) {
    return model.lifecycle.afterSave(body, req);
  }).then(function (body) {
    return model.lifecycle.afterCreate(body, req);
  }).then(res.send.bind(res))['catch'](next);
}

/** Return resource count **/
function count(req, res, next) {
  var model = req.model;
  var body = req.body;

  _Promise2['default'].resolve(body).then(function (body) {
    return _queryBuilder2['default'](model, body);
  }).then(res.send.bind(res))['catch'](next);
}

/** Return a single resource by ID **/
function get(req, res, next) {
  var model = req.model;
  var query = req.query;
  var params = req.params;

  _set.set(query, 'filter.where.id', params.id);

  _Promise2['default'].resolve(query.filter).then(function (body) {
    return model.lifecycle.beforeAccess(body, req);
  }).then(function (body) {
    return _queryBuilder2['default'](model, body);
  }).then(function (body) {
    return model.lifecycle.afterAccess(body, req);
  }).then(res.send.bind(res))['catch'](next);
}

/** Update a single resource by ID **/
function update(req, res, next) {
  var model = req.model;
  var body = req.body;
  var params = req.params;

  _Promise2['default'].resolve(body).then(function (body) {
    return model.lifecycle.beforeSave(body, req);
  }).then(function (body) {
    return model.lifecycle.beforeUpdate(body, req);
  }).then(function (body) {
    return model.update({ id: params.id });
  }).then(function (body) {
    return model.lifecycle.afterSave(body, req);
  }).then(function (body) {
    return model.lifecycle.afterUpdate(body, req);
  }).then(res.send.bind(res))['catch'](next);
}

/** Destroy a single resource by ID **/
function destroy(req, res, next) {
  var model = req.model;
  var query = req.query;
  var params = req.params;

  _Promise2['default'].resolve(query.filter).then(function (body) {
    return model.lifecycle.beforeDelete(body, req);
  }).then(function (body) {
    return model.destroy({ id: params.id });
  }).then(function (body) {
    return model.lifecycle.afterDelete(body, req);
  }).then(res.send.bind(res))['catch'](next);
}
module.exports = exports['default'];