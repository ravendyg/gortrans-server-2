/* global __dirname */
'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

var app = express();

const routes = require('./src/routes');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'gortrans-web', 'build')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(
  function (req, res, next)
  {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
);

// error handlers

// production error handler
app.use(
  function (err, req, res)
  {
    res.status(err.status || 500);
    if (err.status !== 404)
    {
      console.log((new Date()).toLocaleString());
      console.error(err);
    }

    res.status(err.status).end();
  }
);


module.exports = app;


// process
const dataProvider = require('./src/process/data-provider');
dataProvider.startProcess();
