'use strict';

function hasKeys(obj) {
    return Object.keys(obj).length > 0;
}

function flatArrayToDict(acc, e) {
    for (let key of Object.keys(e)) {
        acc[key] = e[key].reduce(busListToDict, {});
    }
    return acc;
}

function busListToDict(acc, bus) {
    acc[bus.graph] = bus;
    return acc;
}

function getIp(req, res, next) {
    let ip = req.headers['x-real-ip'];
    let apiKey = req.query.api_key;
    console.log(ip);
    if (!apiKey) {
      let err = new Error('Not authorized');
      err.status = 403;
      return next(err);
    }
    return next();
}

const utils = {
    hasKeys,
    flatArrayToDict,
    getIp,
};

module.exports = utils;
