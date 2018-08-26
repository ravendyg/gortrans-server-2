function createRouter({
    data,
    express,
    logger,
    routesInfoMappers,
    utils
}) {
    const router = new express.Router();

    router.get(
        '/sync/routes',
        utils.verifyApiKey,
        async (req, res) => {
            logger.startRequestLog(req, res);
            try {
                const { tsp } = req.query;
                const _tsp = parseInt(tsp) * 1000;
                if (isNaN(_tsp)) {
                    return res.status(400).send('Missing timestamp');
                }
                const {
                    routesInfo,
                    timestamp,
                } = await data.getRoutesInfo();
                if (routesInfo) {
                    if (timestamp > _tsp) {
                        return res.json({
                            data: routesInfoMappers.mapV2RoutesInfo(routesInfo)
                        });
                    } else {
                        res.statusCode = 304;
                        return res.end();
                    }
                }
                res.statusCode = 404;
                res.end();
            } catch (err) {
                logger.error(err);
                res.statusCode = 500;
                res.end();
            }
        },
    );

    router.get(
        '/sync/route/:routeKey',
        utils.verifyApiKey,
        async (req, res) => {
            logger.startRequestLog(req, res);
            try {
                const { tsp } = req.query;
                const _tsp = parseInt(tsp) * 1000;
                if (isNaN(_tsp)) {
                    return res.status(400).send('Missing timestamp');
                }
            } catch (err) {
                logger.error(err);
                res.statusCode = 500;
                res.end();
            }
        },
    );

    return router;
}

module.exports = createRouter;
