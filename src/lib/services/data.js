function createDataService({
    config,
    date,
    gortrans,
    logger,
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

    async function getTrassInfo(routeKey) {
        console.log(routeKey);
        return null;
    }

    return {
        getRoutesInfo,
        getTrassInfo,
    };
}



module.exports = createDataService;
