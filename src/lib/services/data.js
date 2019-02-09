function createDataService({
    config,
    date,
    gortrans,
    logger,
    mappers,
    storage,
    crypto,
}) {
    async function getRoutesInfo() {
        let routesInfo;
        let now = date.now();

        let routesInfoWrapper = await storage.getRoutesInfo();
        if (routesInfoWrapper && routesInfoWrapper.timestamp + config.DATA_VALID_FOR > now) {
            return routesInfoWrapper;
        }

        try {
            const _routesInfo = await gortrans.getRoutesInfo();
            routesInfo = mappers.mapV2RoutesInfo(_routesInfo);
            if (routesInfo) {
                const hash = crypto.createHash('md5').update(JSON.stringify(routesInfo)).digest('hex');
                routesInfoWrapper = {
                    hash,
                    routesInfo,
                    timestamp: now,
                };
                storage.setRoutesInfo(routesInfoWrapper);
            }
        } catch (err) {
            logger.error(err);
        }

        return routesInfoWrapper;
    };

    // TODO: can I remove repetition like this in other services?
    async function getTrassInfo(trassKey) {
        let trassInfo;
        let now = date.now();

        let trassInfoWrapper = await storage.getTrassInfo(trassKey);
        if (trassInfoWrapper && trassInfoWrapper.timestamp + config.DATA_VALID_FOR > now) {
            return trassInfoWrapper;
        }

        try {
            trassInfo = await gortrans.getTrassInfo(trassKey, mappers.mapV2TrassInfoIncoming);
            if (trassInfo) {
                const hash = crypto.createHash('md5').update(JSON.stringify(trassInfo)).digest('hex');
                trassInfoWrapper = {
                    hash,
                    timestamp: now,
                    trassInfo,
                    trassKey,
                };
                storage.setTrassInfo(trassInfoWrapper);
            }
        } catch (err) {
            logger.error(err);
        }

        return trassInfoWrapper;
    }

    return {
        getRoutesInfo,
        getTrassInfo,
    };
}

module.exports = createDataService;
