'use strict';

import path from 'path';
import getModels from './models';
import router from './resource-router';
import assert from 'assert';
import Promise from 'bluebird';

var initialized;
var configured;
var middleware = (req, res, next) => res.sendStatus(502);
var initPromise = Promise.fromNode((cb) => { initialized = cb; });

export default function(name) {
  return initPromise.then(function (collections) {
    if (!name) { return collections; }
    assert(collections[name], 'No collection with name "' + name + '" exists');
    return collections[name];
  });
}

export function init(config) {
  assert(
    !configured,
    'You can only initialize waterline-models once'
  );

  configured = true;

  config = Object.assign({
    dir: path.join(process.cwd(), 'models'),
    defaults: {},
    adapters: {},
    connections: {}
    // Defaults
  }, config);

  let models = {};

  getModels(models, config)
    .then(models => {
      middleware = router(models, config);
      console.log('models', Object.keys(models));
      return models;
    })
    .nodeify(initialized);

  return (req, res, next) => middleware(req, res, next);
}
