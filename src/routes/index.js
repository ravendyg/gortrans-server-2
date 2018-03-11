'use strict';

const express = require('express');
const router = new express.Router();
const request = require('request');

const config = require('../lib/config');

const gortrans = require('../lib/services/nskgortrans');
const dataProvider = require('../process/data-provider');


/**
 * sync list of routes, bus lines, and bus stops
 */
router.route('/sync').get(
  (req, res) =>
  {
    let ip = req.headers['x-real-ip'];
    let apiKey = req.query.api_key;
    console.log(ip);
    if (!apiKey)
    {
      res.status(404).send();
      return;
    }

    let routestimestamp = +req.query.routestimestamp || 1;
    let trassestimestamp = +req.query.stopstimestamp || 1;

    let state = gortrans.getState();

    let out =
    {
      routes:
      {
        routes: routestimestamp === 1 || routestimestamp < state.routestimestamp ? state.routes : [],
        routeCodes: routestimestamp === 1 || routestimestamp < state.routestimestamp ? state.routeCodes : [],
        timestamp: routestimestamp < state.routestimestamp ? state.routestimestamp : routestimestamp
      },
      stopsData:
      {
        stops: trassestimestamp === 1 || trassestimestamp < state.trassestimestamp ? state.stops : {},
        busStops: trassestimestamp === 1 || trassestimestamp < state.trassestimestamp ? state.busStops : {},
        timestamp: trassestimestamp < state.trassestimestamp ? state.trassestimestamp : trassestimestamp
      }
    };

    res.json(out);
  }
);

/** stop forecast
 * just pass through
 */
router.route('/stop-schedule').get(
  (req, res) =>
  {
    request(
      {
        url: config.PROXY_URL,
        method: 'GET',
        headers: {
          'x-auth-token': config.API_KEY,
          url: `${config.NSK_FORECAST}id=${req.query.stopId}&type=platform`
        },
      }
    )
    .pipe(res);
  }
);

/**
 * bus rasp
 */
router.route('/bus-rasp').get(
  (req, res) =>
  {
    var rasp;
    var graphs = dataProvider.getCurrentState(req.query.busCode);
    if (graphs)
    {
      var data = graphs[req.query.graph];
      if (data)
      {
        rasp = data.rasp;
      }
    }

    res.json({rasp});
  }
);



/* GET home page. */
router.route('/').get(
  function render(req, res)
  {
    res.render('index', {});
  }
);

router.route('/select-bus').get(
  (req, res) =>
  {
    res.redirect(301, '/');
  }
);

router.route('*').get(
  (req, res) =>
  {
    res.status(404).send('Not Found');
  }
);

module.exports = router;
