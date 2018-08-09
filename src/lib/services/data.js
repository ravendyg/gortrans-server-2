const Storage = require('./storage');
const Gortrans = require('./gortrans-core');
const config = require('../config');

async function getRoutesInfo(tsp) {
    let routesInfoWrapper;
    const timestamp = Date.now();

    try {
        routesInfoWrapper = await Storage.getRoutesInfo();
    } catch (fileError) {
        console.error(fileError);
    }
    if (!routesInfoWrapper || routesInfoWrapper.tsp + config.DATA_VALID_FOR < tsp) {
        try {
            routesInfoWrapper = {
                routesInfo: await Gortrans.getRoutesInfo(),
                tsp: timestamp,
            };
            Storage.setRoutesInfo(routesInfoWrapper);
        } catch (httpError) {
            console.error(httpError);
        }
    } else if (routesInfoWrapper) {
        return {
            tsp: 0,
            routesInfo: null,
        };
    }

    return routesInfoWrapper;
};

module.exports = {
    getRoutesInfo,
};
