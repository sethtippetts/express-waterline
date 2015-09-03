'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _get$set = require('object-path');

var _Promise = require('bluebird');

var _Promise2 = _interopRequireDefault(_Promise);

var _queryBuilder = require('./query-builder');

var _queryBuilder2 = _interopRequireDefault(_queryBuilder);

var _Inflect = require('i');

var _Inflect2 = _interopRequireDefault(_Inflect);

'use strict';

var inflect = new _Inflect2['default']();
var singularize = inflect.singularize.bind(inflect);

exports['default'] = function (config, models) {

  var router = _express2['default'].Router({ mergeParams: true });

  router.use(function (req, res, next) {
    req.model = models[singularize(req.params.resource)];
  });

  router.route('/').get(function (req, res, next) {
    var model = req.model;
    var query = req.query;
    var user = req.user;

    _Promise2['default'].resolve(query).then(function (body) {
      return model.lifecycle.beforeAccess(body, user);
    }).then(function (body) {
      return _queryBuilder2['default'](body, model);
    }).then(function (body) {
      return model.lifecycle.afterAccess(body, user);
    }).then(res.send.bind(res))['catch'](next);
  }).post(function (req, res, next) {
    var model = req.model;
    var body = req.body;
    var user = req.user;

    _Promise2['default'].resolve(body).then(function (body) {
      return model.lifecycle.beforeSave(body, user);
    }).then(function (body) {
      return model.lifecycle.beforeCreate(body, user);
    }).then(function (body) {
      return model.create(body);
    }).then(function (body) {
      return model.lifecycle.afterSave(body, user);
    }).then(function (body) {
      return model.lifecycle.afterCreate(body, user);
    }).then(res.send.bind(res))['catch'](next);
  });

  router.route('/count').get(function (req, res, next) {
    var model = req.model;
    var body = req.body;

    _Promise2['default'].resolve(body).then(function (body) {
      return _queryBuilder2['default'](body, model);
    }).then(res.send.bind(res))['catch'](next);
  });

  router.route('/:id').get(function (req, res, next) {
    var model = req.model;
    var query = req.query;
    var user = req.user;

    _Promise2['default'].resolve(query).then(function (body) {
      return model.lifecycle.beforeAccess(body, user);
    }).then(function (body) {
      return _queryBuilder2['default'](body, model);
    }).then(function (body) {
      return model.lifecycle.afterAccess(body, user);
    }).then(res.send.bind(res))['catch'](next);
  }).put(function (req, res, next) {
    var model = req.model;
    var body = req.body;
    var params = req.params;
    var user = req.user;

    _Promise2['default'].resolve(body).then(function (body) {
      return model.lifecycle.beforeSave(body, user);
    }).then(function (body) {
      return model.lifecycle.beforeUpdate(body, user);
    }).then(function (body) {
      return model.update({ id: params.id });
    }).then(ifSingle).then(function (body) {
      return model.lifecycle.afterSave(body, user);
    }).then(function (body) {
      return model.lifecycle.afterUpdate(body, user);
    }).then(res.send.bind(res))['catch'](next);
  })['delete'](function (req, res, next) {
    var model = req.model;
    var query = req.query;
    var params = req.params;
    var user = req.user;

    _Promise2['default'].resolve(query).then(function (body) {
      return model.lifecycle.beforeDelete(body, user);
    }).then(function (body) {
      return model.destroy({ id: params.id });
    }).then(ifSingle).then(function (body) {
      return model.lifecycle.afterDelete(body, user);
    }).then(res.send.bind(res))['catch'](next);
  });

  function ifSingle(body) {
    return Array.isArray(body) ? body[0] : body;
  }

  return router;
};

module.exports = exports['default'];