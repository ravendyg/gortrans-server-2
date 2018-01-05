'use strict';

const fs = require('fs');
const config = require('../config');

/**
 * Emulate mongoose behavior
 */

const defaults = {
  name: 'info',
  updated: 0,  // last sync
  routesStr: '',
  routeCodes: [],
  routes: {},
  routestimestamp: 0,
  trassesStr: {},
  trasses: {},
  trassestimestamp: 0,
  stops: {},
  busStops: {},
};

const Info = {
  update(_, { $set }, cb)
  {
    fs.readFile(config.DATA_FILE, 'utf8', (err, data) =>
    {
      if (err && err.code !== 'ENOENT')
      {
        if (typeof cb === 'function')
        {
          cb(err);
        }
        else
        {
          console.error(err.stack);
        }
      }
      else
      {
        let oldData;
        try
        {
          oldData = JSON.parse(data);
        }
        catch (e)
        {
          oldData = defaults;
        }
        fs.writeFile(config.DATA_FILE, JSON.stringify({
          ...oldData,
          ...$set,
        }, null, 2), 'utf8', error =>
        {
          if (err && err.code !== 'ENOENT')
          {
            if (typeof cb === 'function')
            {
              cb(error);
            }
            else
            {
              console.error(error.stack);
            }
          }
          else
          {
            if (typeof cb === 'function')
            {
              cb();
            }
          }
        })
      }
    })
  },

  findOne(_, cb)
  {
    fs.readFile(config.DATA_FILE, 'utf8', (err, data) =>
    {
      if (typeof cb === 'function')
      {
        let oldData;
        try
        {
          oldData = JSON.parse(data);
        }
        catch (e)
        {
          oldData = defaults;
        }
        cb(err, oldData);
      }
    });
  }
}

module.exports.Info = Info;
