'use strict';

import express from 'express';
import Inflect from 'i';

import getModels from './';
import * as methods from './methods';

let inflect = new Inflect();
let singularize = inflect.singularize.bind(inflect);

export default function(config) {

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
    getModels(singularize(req.params.resource))
      .then(model => { req.model = model; })
      .then(next)
      .catch(next);
  }
}

/*** ---CRUD Methods--- ***/

/** Query resource list **/
export function list(req, res, next) {
  methods.list(req.model, req)
    .then(res.send.bind(res))
    .catch(next);
}

/** Create new resource **/
export function create(req, res, next) {
  methods.create(req.model, req)
    .then(body => res.status(201).send(body))
    .catch(next);
}

/** Return a single resource by ID **/
export function get(req, res, next) {
  methods.get(req.model, req)
    .then(res.send.bind(res))
    .catch(next);
}

/** Update a single resource by ID **/
export function update(req, res, next) {
  methods.update(req.model, req)
    .then(res.send.bind(res))
    .catch(next);
}

/** Destroy a single resource by ID **/
export function destroy(req, res, next) {
  methods.destroy(req.model, req)
    .then(() => res.sendStatus(204))
    .catch(next);
}




