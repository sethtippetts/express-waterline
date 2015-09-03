import Waterline from 'waterline';
import glob from 'glob';
import { reduce } from 'async';
import path from 'path';
import Promise from 'bluebird';
import { merge } from 'lodash';
import { get, set, coalesce } from 'object-path';
import { pascalCase as pascal } from 'change-case';

const METHODS = [
  'beforeAccess',
  'afterAccess',
  'beforeSave',
  'afterSave',
  'beforeUpdate',
  'afterUpdate',
  'beforeCreate',
  'afterCreate',
  'beforeDelete',
  'afterDelete'
];

let passThrough = (data) => Promise.resolve(data);

export default function(config) {
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
    .filter(model => model.public !== false)
    .map(model => Waterline.Collection.extend(model))
    .map(orm.loadCollection.bind(orm));

  return Promise.promisify(orm.initialize.bind(orm))(config)
    .then(models => models.collections);

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
        let fn = coalesce(model, [method, ['lifecycle', method]], passThrough);
        set(prev, method, execLifecycle.bind(model, fn));

        // Just in case, delete the original so waterline doesn't also call it
        delete model[method];
        return prev;
      }, {});
  }

  function execLifecycle(lifecycle, instance, req, next) {
    if (!instance) instance = {};
    if (!lifecycle) lifecycle = () => Promise.resolve(instance);
    if (!Array.isArray(lifecycle)) {
      return Promise.resolve(lifecycle(instance, req) || instance)
        .nodeify(next);
    }

    return Promise.fromNode(cb => {
      reduce(lifecycle, instance, function(i, mw, cb) {
        Promise.resolve(mw(i, req) || instance).nodeify(cb);
      }, cb);
    }).nodeify(next);
  }
}





