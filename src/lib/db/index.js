'use strict';

const fs = require('fs');
const config = require('../config');

function connectToDb(cb)
{
  if (!fs.existsSync(config.DATA_DIR))
  {
    fs.mkdirSync(config.DATA_DIR);
  }
  if (typeof cb === 'function')
  {
    cb();
  }
}
module.exports.connectToDb = connectToDb;
