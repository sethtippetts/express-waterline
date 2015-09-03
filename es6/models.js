import Waterline from 'waterline';
import glob from 'glob';
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

export default function(models, config) {
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
      console.log('loading model', model.identity);
      model.lifecycle = getLifecycle(model);

      model = merge({}, config.defaults, model);

      if (!model.tableName) model.tableName = pascal(model.identity);
      return model;
    })
    // .filter(model => model.public)
    .map(model => Waterline.Collection.extend(model))
    .map(orm.loadCollection.bind(orm));

  return Promise.promisify(orm.initialize.bind(orm))(config)
    .then(models => models.collections)
    .then(modelList => {
      console.log(Object.keys(modelList || {}));
      Object.assign(models, modelList);
      return modelList;
    });

  function getModel(name) {
    var obj = schema[name];
    if (!obj) throw new Error(`Schmemata for model ${name} not found`);

    if (obj.base) obj = merge({}, getModel(obj.base), obj);

    return obj;
  }

  function getLifecycle(model) {
    return METHODS
      .reduce((prev, method) => {
        let fn = coalesce(model, [method, ['lifecycle', method]], (data) => Promise.resolve(data));
        set(prev, method, execLifecycle.bind(model, fn));

        // Just in case, delete the original so waterline doesn't also call it
        delete model[method];
        return prev;
      }, {});
  }

  function execLifecycle(lifecycle, instance, site, user, next) {
    if (!lifecycle) lifecycle = () => Promise.resolve(instance);
    if (!Array.isArray(lifecycle)) lifecycle = [lifecycle];
    return Promise.all(
      lifecycle.map(mw => mw(instance, user, site))
    ).nodeify(next);
  }
}





