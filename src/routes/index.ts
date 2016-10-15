/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const express = require('express');
const router = express.Router();

import { gortrans } from '../lib/services/nskgortrans';

const errSrev = require('../lib/error');

/**
 * get list of routes
 */
router.route('/list-of-routes').get(
  (req: any, res: any) =>
  {
    gortrans.getListOfRoutes( req.query.tsp || 0 )
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
