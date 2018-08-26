function createDataService({
    config,
    date,
    gortrans,
    logger,
    mappers,
    storage,
}) {
    async function getRoutesInfo() {
        let routesInfoWrapper;
        let routesInfo;
        let now = date.now();

        try {
            routesInfoWrapper = await storage.getRoutesInfo();
        } catch (fileError) {
            logger.error(fileError);
        }
        if (!routesInfoWrapper) {
            routesInfo = await gortrans.getRoutesInfo();
            if (routesInfo) {
                routesInfoWrapper = {
                    routesInfo,
                    timestamp: now,
                };
                storage.setRoutesInfo(routesInfoWrapper);
            }
        } else if (routesInfoWrapper.timestamp + config.DATA_VALID_FOR < now) {
            try {
                const newRoutesInfo = await gortrans.getRoutesInfo();
                if (JSON.stringify(routesInfo) !== JSON.stringify(newRoutesInfo)) {
                    routesInfo = newRoutesInfo;
                    routesInfoWrapper = {
                        routesInfo,
                        timestamp: now,
                    };
                    storage.setRoutesInfo(routesInfoWrapper);
                }
            } catch (httpError) {
                logger.error(httpError);
            }
        }

        return routesInfoWrapper;
    };

    // TODO: can I remove repetition like in other services?
    async function getTrassInfo(trassKey) {
        let trassInfoWrapper;
        let trassInfo;
        let now = date.now();
        const { mapV2TrassInfoIncoming } = mappers;

        try {
            trassInfoWrapper = await storage.getTrassInfo(trassKey);
        } catch (fileError) {
            logger.error(fileError);
        }
        if (!trassInfoWrapper) {
            trassInfo = await gortrans.getTrassInfo(trassKey, mapV2TrassInfoIncoming);
            if (trassInfo) {
                trassInfoWrapper = {
                    timestamp: now,
                    trassInfo,
                };
                storage.setTrassInfo(trassInfoWrapper, trassKey);
            }
        } else if (trassInfoWrapper.timestamp + config.DATA_VALID_FOR < now) {
            try {
                const newTrassInfo = await gortrans.getTrassInfo(trassKey, mapV2TrassInfoIncoming);
                if (JSON.stringify(trassInfo) !== JSON.stringify(newTrassInfo)) {
                    trassInfo = newTrassInfo;
                    trassInfoWrapper = {
                        timestamp: now,
                        trassInfo,
                    };
                    storage.setTrassInfo(trassInfoWrapper, trassKey);
                }
            } catch (httpError) {
                logger.error(httpError);
            }
        }

        return trassInfoWrapper;
    }

    return {
        getRoutesInfo,
        getTrassInfo,
    };
}



module.exports = createDataService;
