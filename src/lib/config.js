'use strict';

const path = require('path');
const globalConfig = require('/etc/project-config.d/config.json')

const NSK_BASE_URL = 'http://maps.nskgortrans.ru/';
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const config = {
    API_KEY: globalConfig.API_KEY,
    PORT: 3024,

    DATA_DIR,

    DATA_FILE: path.join(DATA_DIR, 'all-data.json'),

    DATA_ROUTES_INFO_FILE: 'routes_info.json',

    PROXY_URL: 'http://127.0.0.1:3015/proxy',

    NSK_BASE_URL,
    NSK_ROUTES: NSK_BASE_URL + 'listmarsh.php?r&r=true',
    NSK_BUSES: NSK_BASE_URL + 'markers.php?r=',
    NSK_TRASSES: NSK_BASE_URL + 'trasses.php?r=',
    NSK_FORECAST: NSK_BASE_URL + 'forecast.php?',


    DATA_RETRIEVAL_PERIOD: 1000 * 30, // in miliseconds
    LIST_OF_ROUTES_REFRESH_PERIOD: 1000 * 60 * 60 * 24,

    // @deprecated
    TRASS_DATA_VALID_FOR: 1000 * 60 * 60 * 24,
    DATA_VALID_FOR: 1000 * 60 * 60 * 24,

    FILTER_BUSES_OUT: e => !e.match(/1-264-W/),

    RESET_STATE_AFTER: 1000 * 60 * 5, // 5 minutes

    TILES_VALID_FOR: 60 * 60 * 24 * 31.
};

module.exports = config;
