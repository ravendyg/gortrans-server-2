function createRouter({
    data,
    express,
    logger,
    utils
}) {
    const router = new express.Router();

    router.get(
        '/sync/routes',
        utils.verifyApiKey,
        async (req, res) => {
            logger.startRequestLog(req, res);
            const { hash: userHash } = req.query;
            try {
                const {
                    hash,
                    routesInfo,
                } = await data.getRoutesInfo();
                if (!routesInfo) {
                    res.statusCode = 404;
                    return res.end();
                }
                if (hash !== userHash) {
                    return res.json({
                        data: routesInfo,
                        hash,
                    });
                }
                res.statusCode = 204;
                res.end();
            } catch (err) {
                logger.error(err);
                res.statusCode = 500;
                res.end();
            }
        },
    );

    router.get(
        '/sync/trass/:trassKey',
        utils.verifyApiKey,
        async (req, res) => {
            logger.startRequestLog(req, res);
            try {
                const { trassKey } = req.params;
                const { hash: userHash } = req.query
                const {
                    hash,
                    trassInfo,
                } = await data.getTrassInfo(trassKey);
                if (!trassInfo) {
                    res.statusCode = 404;
                    return res.end();
                }
                if (hash !== userHash) {
                    return res.json({
                        data: trassInfo,
                        hash,
                    });
                }
                res.statusCode = 204;
                res.end();
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
