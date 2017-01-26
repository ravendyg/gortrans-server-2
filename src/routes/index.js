'use strict';

const express = require('express');
const router = express.Router();
const request = require('request');
const Bluebird = require('bluebird');


const config = require('../lib/config');

const gortrans = require('../lib/services/nskgortrans');
const dataProvider = require('../process/data-provider');


/**
 * sync list of routes, bus lines, and bus stops
 */
router.route('/sync').get(
  (req, res) =>
  {
    console.log(req.headers['x-real-ip']);
    let routestimestamp = +req.query.routestimestamp || 0;
    let trassestimestamp = +req.query.stopstimestamp || 0;

    let state = gortrans.getState();

    let out =
    {
      routes:
      {
        routes: routestimestamp < state.routestimestamp ? state.routes : [],
        routeCodes: routestimestamp < state.routestimestamp ? state.routeCodes : [],
        timestamp: routestimestamp < state.routestimestamp ? state.routestimestamp : routestimestamp
      },
      stopsData:
      {
        stops: trassestimestamp < state.trassestimestamp ? state.stops : {},
        busStops: trassestimestamp < state.trassestimestamp ? state.busStops : {},
        timestamp: trassestimestamp < state.trassestimestamp ? state.trassestimestamp : trassestimestamp
      }
    };

    res.json(out);
  }
);

// /**
//  * get list of routes
//  */
// router.route('/list-of-routes').get(
//   (req, res) =>
//   {
//     gortrans.getListOfRoutes( req.query.timestamp || 0 )
//     .then(
//       data =>
//       {
//         res.json({data});
//       }
//     )
//     .catch(
//       err =>
//       {
//         console.error(err, 'GET /list-of-routes' );
//         res.json({data: {routes: [], timestamp: +req.query.timestamp || 0}});
//       }
//     );
//   }
// );

// /**
//  * get list of route codes
//  */
// router.route('/list-of-route-codes').get(
//   (req, res) =>
//   {
//     gortrans.getListOfRouteCodes( req.query.timestamp || 0 )
//     .then(
//       data =>
//       {
//         res.json({data});
//       }
//     )
//     .catch(
//       err =>
//       {
//         console.error(err, 'GET /list-of-route-codes' );
//         res.json({data: {routeCodes: [], timestamp: +req.query.timestamp || 0}});
//       }
//     );
//   }
// );

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
        qs: { url: encodeURI( `${config.NSK_FORECAST}id=${req.query.stopId}&type=platform` ) }
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
  function( req, res, next)
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
