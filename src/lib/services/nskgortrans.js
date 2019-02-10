// TODO: merge with gortrans-core
const request = require('request');
const Bluebird = require('bluebird');

const config = require('../config');

let state = {
    name: 'info',
    updated: 0,
    routes: [],
    routeCodes: [],
    routestimestamp: 0,
    trasses: {},
    trassestimestamp: 0,
    stops: {},
    busStops: {}
};

module.exports = {
    getListOfAvailableBuses,
    getTrass,
    getState: () => state,
};

/**
 * get list of buses out there
 * @codes // concatenated codes
 */
function getListOfAvailableBuses(codes) {
    return new Bluebird(fetchListOfAvailableBuses.bind(this, codes));
}

function fetchListOfAvailableBuses(codes, resolve, reject) {
    request(
        {
            url: config.PROXY_URL,
            method: 'GET',
            headers: {
                'x-auth-token': config.API_KEY,
                url: config.NSK_BUSES + codes,
            },
        },
        getListOfAvailableBusesHandler.bind(this, resolve, reject, codes)
    );
}

function getListOfAvailableBusesHandler(
    resolve, reject, codesQuery,
    err, httpResponse, body) {
    if (err) {
        console.error(err, 'getListOfAvailableBuses request');
        resolve({});
    } else if (httpResponse.statusCode !== 200) {
        console.error(httpResponse.statusCode, 'not 200 response', 'getListOfAvailableBuses request');
        resolve({});
    } else {
        try {
            let data = JSON.parse(body).markers;

            var out =
                data
                    .reduce(
                        (acc, e) => {
                            let code = e.id_typetr + '-' + e.marsh + '-W-' + e.title;
                            acc[code] = acc[code] ? acc[code].concat(e) : [e];
                            return acc;
                        },
                        {}
                    );

            let codes = codesQuery.split('|');
            for (let code of codes) { // in case there were no markers for this bus
                if (!out[code]) {
                    out[code] = [];
                }
            }

            resolve(out);
        } catch (e) {
            reject(e);
        }
    }
}

function getTrass(busCode, tsp) {
    return !tsp || state.trassestimestamp > tsp
        ? state.trasses[busCode]
        : null
        ;
}
