'use strict';

import path from 'path';
import assert from 'assert';
import Promise from 'bluebird';
import getModels from './models';
import router from './resource-router';

var initialized;
var configured;
var middleware = (req, res, next) => {
  res
    .status(502)
    .send({ code: 502, message: 'Server starting. Please wait.' });
};

var initPromise = Promise.fromNode((cb) => { initialized = cb; });

export default (name) => initPromise
  .then((collections) => {
    if (!name) return collections;
    assert(collections[name], 'No collection with name "' + name + '" exists');
    return collections[name];
  });

export function init(config) {
  assert(
    !configured,
    'You can only initialize waterline-models once'
  );

  configured = true;

  // Defaults
  config = Object.assign({
    dir: path.join(process.cwd(), 'models'),
    defaults: {},
    adapters: {},
    connections: {},
  }, config);

  // Passing
  getModels(config)
    .then(models => {
      middleware = router(models, config);
      return models;
    })
    .nodeify(initialized);

  return (req, res, next) => middleware(req, res, next);
}
