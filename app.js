#!/usr/bin/env node

/* global __dirname */
'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const _logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const request = require('request');
const crypto = require('crypto');
const http = require('http');

const mappers = require('./src/lib/mappers/dto');
const date = Date;
const logger = require('./src/lib/services/logger')({
    date,
});
const config = require('./src/lib/config');
const utils = require('./src/lib/utils');
const storage = require('./src/lib/services/storage')({
    config,
    logger,
    fs,
    path,
    utils,
});
const gortrans = require('./src/lib/services/gortrans-core')({
    config,
    logger,
    request,
});
const data = require('./src/lib/services/data')({
    config,
    crypto,
    date,
    gortrans,
    logger,
    mappers,
    storage,
});
const socket = require('./src/lib/services/socket');
const webSocket = require('./src/lib/services/webSocket');

var app = express();

const routes = require('./src/routes');
const routesV2 = require('./src/routes/v2')({
    data,
    express,
    logger,
    utils,
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(_logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'gortrans-web', 'build')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/v2', routesV2);
app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res) => {
    res.statusCode = 404;
    res.end();
});

// error handlers
app.use((req, res) => {
    res.statusCode = 404;
    res.end();
});

// production error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(err.status || 500);
    if (err.status !== 404) {
        console.log((new Date()).toLocaleString());
        console.error(err.stack);
    }
    res.status(err.status).end();
});

// process
const dataProvider = require('./src/process/data-provider');
dataProvider.startProcess();

const server = http.createServer(app);
socket.start(server);
webSocket.start({
    server,
    dataProvider,
    logger,
    date,
});

server.listen(config.PORT);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    logger.error(error);
    process.exit(1);
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}

module.exports = app;
