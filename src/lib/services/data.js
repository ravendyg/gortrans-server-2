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
        if (routesInfoWrapper && routesInfoWrapper.timestamp < now + config.DATA_VALID_FOR) {
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
            console.error(err);
        }

        return routesInfoWrapper;
    };

    // TODO: can I remove repetition like this in other services?
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
