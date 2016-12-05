/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const express = require('express');
const router = express.Router();
const request = require('request');

import { config } from '../lib/config';

import * as Bluebird from 'bluebird';

import { gortrans } from '../lib/services/nskgortrans';
import { getCurrentState } from '../process/data-provider';
import { db } from '../lib/db/db';

const errSrev = require('../lib/error');

/**
 * sync list of routes, bus lines, and bus stops
 */
router.route('/sync').get(
  (req: any, res: any) =>
  {
    let routesTimestamp = +req.query.routestimestamp || 0;
    let trassesTimestamp = +req.query.trassestimestamp || 0;
    let stopsTimestamp = +req.query.stopstimestamp || 0;
    Bluebird.all([
      gortrans.getListOfRoutes(routesTimestamp),
      db.getTrasses(trassesTimestamp),
      db.getLatestTrass(),
      gortrans.getStops(stopsTimestamp)
    ])
    .then(
      (data: any) =>
      {
        let out: any =
        {
          routes: { routes: data[0].routes, timestamp: data[0].timestamp },
          trasses: { trasses: {}, timestamp: data[2].timestamp || 0 },
          stopsData: { stops: data[3].stops, busStops: data[3].busStops, timestamp: data[3].timestamp }
        };
        for ( let trass of data[1] )
        {
          out.trasses.trasses[trass.busCode] = trass.trass;
        }
        res.json(out);
      }
    )
    .catch(
      (err: Error) =>
      {
        console.error(err, '/sync');
        res.json({
          routes: { routes: [], timestamp: 0 },
          trasses: { trasses: [], timestamp: 0 },
          stopsData: { stops: {}, busStops: {}, timestamp: 0 }
        });
      }
    );
  }
);

/**
 * get list of routes
 */
router.route('/list-of-routes').get(
  (req: any, res: any) =>
  {
    gortrans.getListOfRoutes( req.query.timestamp || 0 )
    .then(
      (data: {routes: ListMarsh [], timestamp: number}) =>
      {
        res.json({data});
      }
    )
    .catch(
      (err: Error) =>
      {
        console.error(err, 'GET /list-of-routes' );
        res.json({data: {routes: [], timestamp: +req.query.timestamp || 0}});
      }
    );
  }
);

/**
 * get list of route codes
 */
router.route('/list-of-route-codes').get(
  (req: any, res: any) =>
  {
    gortrans.getListOfRouteCodes( req.query.timestamp || 0 )
    .then(
      (data: {routeCodes: string [], timestamp: number}) =>
      {
        res.json({data});
      }
    )
    .catch(
      (err: Error) =>
      {
        console.error(err, 'GET /list-of-route-codes' );
        res.json({data: {routeCodes: [], timestamp: +req.query.timestamp || 0}});
      }
    );
  }
);

/** stop forecast
 * just pass through
 */
router.route('/stop-schedule').get(
  (req: any, res: any) =>
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
  (req: any, res: any) =>
  {
    var rasp: string;
    var graphs: any = getCurrentState(req.query.busCode);
    if (graphs)
    {
      var data: busData = graphs[req.query.graph];
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
  function( req: any, res: any, next: any)
  {
    res.render('index', {});
  }
);

router.route('*').get(
  (req: any, res: any) =>
  {
    res.redirect(301, '/');
  }
);




module.exports = router;
