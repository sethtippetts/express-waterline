'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _bool = require('boolean');

var _bool2 = _interopRequireDefault(_bool);

'use strict';

exports['default'] = function (model) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];

  var where = _ref.where;
  var limit = _ref.limit;
  var include = _ref.include;
  var populate = _ref.populate;
  var fields = _ref.fields;
  var select = _ref.select;
  var order = _ref.order;
  var sort = _ref.sort;
  var offset = _ref.offset;

  // Aliases
  if (sort) order = sort;
  if (populate) include = populate;
  if (fields) select = fields;

  if (typeof select === 'string') select = [select];

  var params = undefined;

  var method = 'find';
  if (select) params = { select: select };
  if (where && where.id) {
    if (where.id === 'count') {
      method = 'count';
    } else {
      method += 'One';
      params = { id: where.id };
    }

    delete where.id;
  }

  console.log('QUERY BUILDER', model.identity, method, params, where);

  var query = model[method](params);

  if (where) query.where(cleanup(where, model));
  if (where && where.id !== 'count') {
    if (order) query.sort(order);
    if (include) query.populate(typeof include === 'object' ? Object.keys(include).join(' ') : include);
    if (offset) query.skip(offset);
    if (limit) query.limit(limit);
  }

  return query.then(function (data) {
    return data;
  });
};

function cleanup(where, model) {
  return Object.keys(where).reduce(function (obj, prop) {

    // TODO: Probably bad practice to reference underscored properties...
    obj[prop] = coerce(where[prop], model._cast._types[prop] || 'string');
    return obj;
  }, {});
}

function coerce(val, type) {
  if (Array.isArray(val)) {
    return val.map(function (v) {
      return coerce(v, type);
    });
  }if (type === 'string') {
    return (val || '').toString();
  }if (type === 'integer') {
    return parseInt(val || 0);
  }if (type === 'double' || type === 'float') {
    return parseFloat(val || 0);
  }if (type === 'boolean') {
    return _bool2['default'](val);
  }
}
module.exports = exports['default'];