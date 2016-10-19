/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const express = require('express');
const router = express.Router();

import {Promise} from 'es6-promise';
import * as bb from 'bluebird';

import { gortrans } from '../lib/services/nskgortrans';
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
    bb.all([
      gortrans.getListOfRoutes(routesTimestamp),
      db.getTrasses(trassesTimestamp),
      db.getLatestTrass()
    ])
    .then(
      (data: any) =>
      {
        let out: any =
        {
          routes: { routes: data[0].routes, timestamp: data[0].timestamp },
          trasses: { trasses: {}, timestamp: data[2].timestamp || 0 },
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
