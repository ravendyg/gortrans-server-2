'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Info =
  mongoose.model(
    'Info',
    new Schema({
      name: { type: String, default: 'info' },
      updated: { type: Number, default: 0 },  // last sync
      routesStr: { type: String, default: '' },
      routeCodes: { type: Array, default: [] },
      routes: { type: Object, default: {} },
      routestimestamp: { type: Number, default: 0 },
      trassesStr: { type: Object, default: {} },
      trasses: { type: Object, default: {} },
      trassestimestamp: { type: Number, default: 0 },
      stops: { type: Object, default: {} },
      busStops: { type: Object, default: {} },
    })
  );
module.exports.Info = Info;