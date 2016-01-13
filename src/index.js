import path from 'path';
import assert from 'assert';
import Promise from 'bluebird';
import initModels from './models';
import router, { getTenantId } from './resource-router';
import debug from 'debug';

let log = debug('express:waterline');

var initialized;
var configured;
var initPromise = Promise.fromNode((cb) => { initialized = cb; });

export let getModels = (name, env) => initPromise
  .then((collections) => {
    log(`Getting models for key ${name} and environment ${env || 'default'}`);
    if (!name) return collections;
    if (env && env !== 'default') name += `-${env.toLowerCase()}`;
    assert(collections[name], 'No collection with name "' + name + '" exists');
    return collections[name];
  });

export default (name, env) => {
  if (typeof env === 'object') {
    env = getTenantId(env);
  }
  return getModels(name, env);
};

export function lifecycle(model, cycle) {
  log('Calling lifecycle method %s on %s', cycle, model.identity);
  return (ins, req) => getModels(model)
    .then(Model => Model.lifecycle[cycle](ins, req));
}

export function init(config) {
  log('Initializing with config %o', config);
  assert(
    !configured,
    'You can only initialize waterline-models once'
  );

  configured = true;

  let tenantKey = 'Env';
  // Defaults
  config = Object.assign({
    dir: path.join(process.cwd(), 'models'),
    tenantKey,
    getTenant: req => getTenantId(tenantKey, req),
    defaults: {},
    adapters: {},
    connections: {},
  }, config);

  config.getTenant = Promise.method(config.getTenant);

  // Passing
  initModels(config).nodeify(initialized);

  return router(config);
}

export * from './methods';
