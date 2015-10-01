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

  if (include && !Array.isArray(include)) {
    if (typeof include === 'object') include = Object.keys(include);
    if (typeof include === 'string') include = [include];
  }
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
    if (include) include.map(incl => query.populate(incl));
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
      let castType = model._cast._types[prop];
      obj[prop] = castType ? coerce(where[prop], castType) : where[prop];
      return obj;
    }, {});
}

function coerce(val, type) {
  if (val === null) return val;
  if (Array.isArray(val)) return val.map((v) => coerce(v, type));
  if (typeof val === 'object') return Object.keys(val).reduce((prev, curr) => {
    prev[curr] = coerce(val[curr], type);
    return prev;
  }, {});
  if (type === 'string') return (val || '').toString();
  if (type === 'integer') return parseInt(val || 0);
  if (type === 'double' || type === 'float') return parseFloat(val || 0.0);
  if (type === 'boolean') return bool(val);
}
