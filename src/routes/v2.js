const express = require('express');

const config = require('../lib/config');
const { getIp } = require('../lib/utils');
const Data = require('../lib/services/data');

const router = new express.Router();

router.get(
    '/sync/routes',
    getIp,
    async (req, res) => {
        const { tsp } = req.query;
        const timestamp = parseInt(tsp);
        if (isNaN(timestamp)) {
            return res.status(400).send('Missing timestamp');
        }
        const routesInfoWrapper = await Data.getRoutesInfo(timestamp);
        if (routesInfoWrapper) {
            const { routesInfo } = routesInfoWrapper;
            if (routesInfo) {
                return res.json(routesInfoWrapper);
            } else {
                res.statusCode = 304;
                return res.end();
            }
        }
        res.statusCode = 404;
        res.edn();
    }
);

module.exports = router;
