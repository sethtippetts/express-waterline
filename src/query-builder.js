'use strict';

import bool from 'boolean';


export default (model, {
  where,
  limit,
  include,
  populate,
  fields,
  select,
  order,
  sort,
  offset
} = {}) => {

  // Aliases
  if (sort) order = sort;
  if (populate) include = populate;
  if (fields) select = fields;

  if (typeof include === 'object') include = Object.keys(include).join(' ');
  if (typeof select === 'string') select = [select];


  let params;
  let method = 'find';
  let isCount = !!where && where.id === 'count';

  if (select) params = { select };
  if (where && where.id) {
    if (isCount) {
      method = 'count';
    } else {
      method += 'One';
      params = { id: where.id };
    }

    delete where.id;
  }

  let query = model[method](params);

  if (where) query.where(cleanup(where, model));
  if (!isCount) {
    if (order) query.sort(order);
    if (include) query.populate(include);
    if (offset) query.skip(offset);
    if (limit) query.limit(limit);
  }

  return query.then(data => {
    if (isCount) data = { count: data };
    return data;
  });
};

function cleanup(where, model) {
  return Object.keys(where)
    .reduce((obj, prop) => {

      // TODO: Probably bad practice to reference underscored properties...
      obj[prop] = coerce(where[prop], model._cast._types[prop] || 'string');
      return obj;
    }, {});
}

function coerce(val, type) {
  if (Array.isArray(val)) return val.map((v) => coerce(v, type));
  if (type === 'string') return (val || '').toString();
  if (type === 'integer') return parseInt(val || 0);
  if (type === 'double' || type === 'float') return parseFloat(val || 0.0);
  if (type === 'boolean') return bool(val);
}
