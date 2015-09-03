'use strict';

import express from 'express';
import { get, set } from 'object-path';
import Promise from 'bluebird';
import queryBuilder from './query-builder';
import Inflect from 'i';

let inflect = new Inflect();
let singularize = inflect.singularize.bind(inflect);

export default function(config, models) {

  let router = express.Router({ mergeParams: true });

  router.use((req, res, next) => {
    req.model = models[singularize(req.params.resource)];
  });

  router.route('/')
    .get((req, res, next) => {
      let { model, query, user } = req;

      Promise.resolve(query)
        .then(body => model.lifecycle.beforeAccess(body, user))
        .then(body => queryBuilder(body, model))
        .then(body => model.lifecycle.afterAccess(body, user))
        .then(res.send.bind(res))
        .catch(next);
    })
    .post((req, res, next) => {
      let { model, body, user } = req;

      Promise.resolve(body)
        .then(body => model.lifecycle.beforeSave(body, user))
        .then(body => model.lifecycle.beforeCreate(body, user))
        .then(body => model.create(body))
        .then(body => model.lifecycle.afterSave(body, user))
        .then(body => model.lifecycle.afterCreate(body, user))
        .then(res.send.bind(res))
        .catch(next);
    });

  router.route('/count')
    .get(
      (req, res, next) => {
        let { model, body } = req;

        Promise.resolve(body)
          .then(body => queryBuilder(body, model))
          .then(res.send.bind(res))
          .catch(next);
      }
    );

  router.route('/:id')
    .get((req, res, next) => {
      let { model, query, user } = req;

      Promise.resolve(query)
        .then(body => model.lifecycle.beforeAccess(body, user))
        .then(body => queryBuilder(body, model))
        .then(body => model.lifecycle.afterAccess(body, user))
        .then(res.send.bind(res))
        .catch(next);
    })
    .put((req, res, next) => {
      let { model, body, params, user } = req;

      Promise.resolve(body)
        .then(body => model.lifecycle.beforeSave(body, user))
        .then(body => model.lifecycle.beforeUpdate(body, user))
        .then(body => model.update({ id: params.id }))
        .then(ifSingle)
        .then(body => model.lifecycle.afterSave(body, user))
        .then(body => model.lifecycle.afterUpdate(body, user))
        .then(res.send.bind(res))
        .catch(next);
    })
    .delete((req, res, next) => {
      let { model, query, params, user } = req;

      Promise.resolve(query)
        .then(body => model.lifecycle.beforeDelete(body, user))
        .then(body => model.destroy({ id: params.id }))
        .then(ifSingle)
        .then(body => model.lifecycle.afterDelete(body, user))
        .then(res.send.bind(res))
        .catch(next);
    });

  function ifSingle(body) {
    return Array.isArray(body) ? body[0] : body;
  }

  return router;
}



