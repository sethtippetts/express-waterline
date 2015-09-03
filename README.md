![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)

# Express Waterline

Automagic API built from Waterline models and ExpressJS

## Getting started

Pass your Waterline config object to the `waterline.init` function.
The `waterline.init` function returns a middleware that handles all your API routing

```js
import express from 'express';
import waterline from 'express-waterline';

// Parsers
import { json } from 'body-parser';

let app = express();

// Required to parse `req.body`
app.use(json());

// Express Waterline middleware configuration
app.use('/api/v1', waterline.init({
  dir: path.join(process.cwd(), 'models'),
  adapters: { },
  connections: { }
}));
```

### Accessing Waterline models

Any model can be accessed by passing the model name to the default method. The default method returns a promise resolving to the desired model.

```js
import getModel from 'express-waterline';

let Person = getModel('person');

Person.then((Model) => Model.find({
  employeeBadgeId: badgeId
}));
```

## Extra fanciness

Waterline models are great, but there were a few extra features that we thought would be nifty to have:

### Model extension

Waterline by default doesn't support extending models like classes. It's nice, if say, several models share similar ACLs, attributes, or database configuration.
All you have to do is define the property `base` and the name of the model you're extending

```js
// models/person.js
{
  identity: 'person',
  connection: 'mongo',
  autoPK: true,
  autoCreatedAt: false,
  lifecycle: {
    beforeAccess: (query, req) => {
      if (!req.user) throw new Error('Unauthorized');
    }
  }
}

// models/customer.js
{
  identity: 'customer',
  base: 'person',
  autoPK: false,
  lifecycle: {
    beforeAccess: (query, req) => {
      // Other stuff
    }
  }
}

// Customer model will look like this:
{
  identity: 'customer',
  connection: 'mongo',
  autoPK: false,
  autoCreatedAt: false,
  lifecycle: [
  {
    beforeAccess: [
      (query, req) => {
        if (!req.user) throw new Error('Unauthorized');
      },
      (query, req) => {
        // Other stuff
      }
    ]
  }
}
```

### Lifecycle Callback Context

Waterline models come with built in lifecycle callbacks, but they don't give much context other than the values of the instances you're modifying.
_Express Waterline_ adds two extra methods `beforeAccess` and `afterAccess` to give you the ability to modify the query and the response of `GET` requests.
_Express Waterline_ models include the Express request a second argument.

The third argument is a node callback, but you can return a synchronous value or a Promise resolving to the value instead.
Because `query` and `body` are objects, the values defined in them are pass-by-reference, so you can return undefined too!

`models/person.js`
```js
'use strict';

import crypto from 'crypto';
import { set } from 'object-path';

export default {
  identity: 'utility-company',
  tableName: 'Utility_Company__c',
  attributes: {
    name: {
      type: 'string',
      columnName: 'Name'
    },
    state: {
      type: 'string',
      columnName: 'Service_Address_State__c'
    },
    password: {
      type: 'string',
      columnName: 'password'
    }
  },
  lifecycle: {
    // Happens before all GET requests
    beforeAccess: (query, req) => {
      set(query, 'where.rate', 0.15);
      return query;
    },

    // Happens before POST, and PUT requests
    beforeSave: (body, req) => {
      if (body.password) {
        let hash = crypto.createHash('sha1');
        hash.update(body.password);
        body.password = hash.digest('hex');
      }
    },

    // Happens after POST, and PUT requests
    afterSave: (body, req) => {
      delete body.password;
    }
  }
};
```

