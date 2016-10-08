/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const express = require('express');
const router = express.Router();


const errSrev = require('../lib/error');

/* GET home page. */
router.route('/').get(
  function( req: any, res: any, next: any)
  {
    res.render('index', {});
  }
);


module.exports = router;
