'use strict';

import express from 'express';
import { set } from 'object-path';
import Promise from 'bluebird';
import Inflect from 'i';

import queryBuilder from './query-builder';

let inflect = new Inflect();
let singularize = inflect.singularize.bind(inflect);

export default function(models, config) {

  let router = express.Router();

  router.use('/:resource', getResource);

  router.route('/:resource')
    .get(list)
    .post(create);

  router.route('/:resource/:id')
    .get(get)
    .put(update)
    .delete(destroy);

  return router;


  /** Inject model **/
  function getResource(req, res, next) {
    req.model = models[singularize(req.params.resource)];
    next();
  }
}

/*** ---CRUD Methods--- ***/

/** Query resource list **/
function list(req, res, next) {
  let { model, query } = req;

  Promise.resolve(query.filter)
    .then(body => model.lifecycle.beforeAccess(body, req))
    .then(body => queryBuilder(model, body))
    .then(body => model.lifecycle.afterAccess(body, req))
    .then(res.send.bind(res))
    .catch(next);
}

/** Create new resource **/
function create(req, res, next) {
  let { model, body } = req;

  Promise.resolve(body)
    .then(body => model.lifecycle.beforeSave(body, req))
    .then(body => model.lifecycle.beforeCreate(body, req))
    .then(body => model.create(body))
    .then(body => model.lifecycle.afterSave(body, req))
    .then(body => model.lifecycle.afterCreate(body, req))
    .then(res.send.bind(res))
    .catch(next);
}

/** Return a single resource by ID **/
function get(req, res, next) {
  let { model, query, params } = req;

  set(query, 'filter.where.id', params.id);

  Promise.resolve(query.filter)
    .then(body => model.lifecycle.beforeAccess(body, req))
    .then(body => queryBuilder(model, body))
    .then(body => model.lifecycle.afterAccess(body, req))
    .then(res.send.bind(res))
    .catch(next);
}

/** Update a single resource by ID **/
function update(req, res, next) {
  let { model, body, params } = req;

  Promise.resolve(body)
    .then(body => model.lifecycle.beforeSave(body, req))
    .then(body => model.lifecycle.beforeUpdate(body, req))
    .then(body => model.update({ id: params.id }))
    .then(body => model.lifecycle.afterSave(body, req))
    .then(body => model.lifecycle.afterUpdate(body, req))
    .then(res.send.bind(res))
    .catch(next);
}

/** Destroy a single resource by ID **/
function destroy(req, res, next) {
  let { model, query, params } = req;

  Promise.resolve(query.filter)
    .then(body => model.lifecycle.beforeDelete(body, req))
    .then(body => model.destroy({ id: params.id }))
    .then(body => model.lifecycle.afterDelete(body, req))
    .then(res.send.bind(res))
    .catch(next);
}



