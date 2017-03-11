'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Log =
  mongoose.model(
    'Log',
    new Schema({
      apiKey: Number,
      tsp: Number,
      end: Number,
      action: String,
      ip: String,
      target: String,
      agent: String
    })
  );

module.exports = {
  createRecord, recordEnd,
};

function createRecord({apiKey, action, ip, target, agent})
{
  let tsp = Date.now();
  return Log.create({
    apiKey,
    action,
    ip,
    tsp,
    end: 0,
    target,
    agent
  })
  .then(doc =>
  {
    let _id = null;
    if (doc)
    {
      _id = doc._id;
    }
    return _id;
  });
}

function recordEnd(_id)
{
  let end = Date.now();
  Log.findByIdAndUpdate(_id, {end}, () => {});
}