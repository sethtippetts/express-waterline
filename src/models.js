import Waterline from 'waterline';
import glob from 'glob';
import { reduce } from 'async';
import path from 'path';
import Promise from 'bluebird';
import { merge } from 'lodash';
import { get, set } from 'object-path';
import { pascalCase as pascal } from 'change-case';
import debug from 'debug';

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

  Object.keys(schema)
    .map(getModel)
    .map(model => {
      model.lifecycle = getLifecycle(model);

      model = merge({}, config.defaults, model);

      if (!model.tableName) model.tableName = pascal(model.identity);
      return model;
    })
    .filter(model => model.public !== false && !!model.connection)
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

  function execLifecycle(lifecycle, ...args) {
    let [instance] = args;
    if (!instance) instance = args[0] = {};
    if (!lifecycle) lifecycle = () => Promise.resolve(instance);
    if (!Array.isArray(lifecycle)) lifecycle = [lifecycle];

    return Promise.fromNode(cb => {
      reduce(lifecycle, instance, (i, mw, cb) => {
        Promise.method(mw).apply(this, args)
          .then(ins => {
            if (typeof ins !== 'undefined') return ins;
            return instance;
          }).nodeify(cb);
      }, cb);
    });
  }
}





