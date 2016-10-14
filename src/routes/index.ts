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
      (data: {routes: ListMarsh [], tsp: number}) =>
      {
        res.json({data});
      }
    )
    .catch(
      (err: Error) =>
      {
        console.error(err, 'GET /list-of-routes' );
        res.json({data: {routes: [], tsp: +req.query.tsp || 0}});
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




module.exports = router;
