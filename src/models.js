import Waterline from 'waterline';
import glob from 'glob';
import { reduce } from 'async';
import path from 'path';
import Promise from 'bluebird';
import { merge } from 'lodash';
import { get, set } from 'object-path';
import { pascalCase as pascal } from 'change-case';
import debug from 'debug';
import assert from 'assert';
import clone from 'clone';

let log = debug('express:waterline');

const METHODS = [
  // GET
  'beforeAccess',
  'afterAccess',

  // PUT, POST
  'beforeSave',
  'afterSave',

  // PUT
  'beforeUpdate',
  'afterUpdate',

  // POST
  'beforeCreate',
  'afterCreate',

  // DELETE
  'beforeDelete',
  'afterDelete',
];

let passThrough = (data) => Promise.resolve(data);

export default function(config) {

  var connections = get(config, 'connections', {});
  var multiTenant = {};
  config.connections =  Object.keys(get(config, 'connections', {}))
    .reduce((connections, key) => {
      let tenants = connections[key];
      if (Array.isArray(tenants)) {
        multiTenant[key] = tenants.map(tenant => {
          let id = tenant.tenantId;
          assert(!!id, 'Field "tenantId" required for multi-tenant connections');
          id = id.toLowerCase();
          log(`Creating tenant ${key} ${id}`);
          if (id !== 'default') connections[`${key}-${id}`] = tenant;
          else connections[key] = tenant;
          return id;
        });
        if (Array.isArray(connections[key])) delete connections[key];
      }

      return connections;
    }, connections);

  log('Initializing models');
  // Instantiate a new instance of the ORM
  var orm = new Waterline();

  var schema = glob
    .sync(path.join(config.dir, '**/*.js'))
    .map(require)
    .reduce((schema, schemata) => {
      schema[schemata.identity] = schemata;
      return schema;
    }, {});

  var models = Object.keys(schema)
    .map(getModel)
    .map(model => {
      model.lifecycle = getLifecycle(model);

      model = merge({}, config.defaults, model);

      if (!model.tableName) model.tableName = pascal(model.identity);
      return model;
    })
    .filter(model => model.public !== false && !!model.connection);


  models
    .reduce((prev, curr) => {
      let { connection } = curr;
      let tenants = multiTenant[connection];
      if (Array.isArray(tenants)) {
        tenants
          .map(tenant => {
            let obj = clone(curr, false);
            let suff = suffix.bind(this, tenant);
            if (tenant !== 'default') {
              suff(obj, 'identity');
              suff(obj, 'connection');

              // Adding suffixes to foreign key attributes
              Object.keys(obj.attributes)
                .map(key => {
                  suff(obj, ['attributes', key, 'model'])
                  suff(obj, ['attributes', key, 'collection'])
                });
            }
            log(`Adding model ${obj.identity}`);
            prev.push(obj);
          });
      } else {
        prev.push(curr);
      }
      return prev;
    }, models)
    .map(model => Waterline.Collection.extend(model))
    .map(orm.loadCollection.bind(orm));

  return Promise.promisify(orm.initialize.bind(orm))(config)
    .then(models => {
      log('Waterline started');
      return models.collections;
    });

  function getModel(name) {
    var obj = schema[name];
    if (!obj) throw new Error(`Schmemata for model ${name} not found`);

    if (obj.base) obj = merge({}, getModel(obj.base), obj, (a, b, key) => {
      if (~METHODS.indexOf(key) && a && b) {
        if (!Array.isArray(a)) a = [a];
        if (!Array.isArray(b)) b = [b];
        return a.concat(b);
      }
    });

    return obj;
  }

  function getLifecycle(model) {
    return METHODS
      .reduce((prev, method) => {
        let fn = get(model, ['lifecycle', method], passThrough);
        set(prev, method, execLifecycle.bind(model, fn));
        return prev;
      }, {});
  }

  function suffix(suffix, obj, key) {
    let val = get(obj, key);
    if (val) set(obj, key, `${get(obj, key)}-${suffix}`);
    return obj;
  }

  function execLifecycle(lifecycle, ...args) {
    log('exec lifecycle %s', lifecycle);
    let [instance] = args;
    if (!instance) instance = args[0] = {};
    if (!lifecycle) lifecycle = () => Promise.resolve(instance);
    if (!Array.isArray(lifecycle)) lifecycle = [lifecycle];

    return Promise.reduce(lifecycle, (prev, mw) => {
      return Promise.method(mw)
        .apply(this, args)
        .then(ins => {
          if (typeof ins !== 'undefined') return ins;
          return instance;
        });
    }, instance);
  }
}
