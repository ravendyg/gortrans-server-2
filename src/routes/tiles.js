function generateTileUrl(node, chunks) {
    // 17/95772/41550.png
    return `https://${node}.basemaps.cartocdn.com/light_all/${chunks.join('/')}`;
}

function createTileRoute({
    crypto,
    express,
    redisClient,
    request,
    logger,
    config,
}) {
    const router = new express.Router();

    function send(res, data) {
        res.setHeader('content-type', 'image/png');
        res.setHeader('cache-control', 'max-age=' + config.TILES_VALID_FOR);
        res.send(data);
    }

    function getImage(url, res, key) {
        request({
            method: 'GET',
            url,
            encoding: null,
        }, (err, resp) => {
            if (err) {
                logger.error(err);
                res.statusCode = 500;
                return res.send();
            }
            redisClient.set(key, resp.body);
            redisClient.set('tsp-' + key, Date.now());
            send(res, resp.body);
        });
    }

    router.get('*', (req, res) => {
        const [node, ...chunks] = req.url.split('/').slice(1);
        const url = generateTileUrl(node, chunks);
        if (node === 'favicon.ico') {
            res.statusCode = 404;
            return res.send();
        }
        const key = crypto.createHash('md5').update(url).digest('hex');
        const tspKey = 'tsp-' + key;
        redisClient.get(tspKey, (redisTspErr, tspBuf) => {
            if (redisTspErr) {
                logger.error(redisTspErr);
            }
            if (!tspBuf) {
                return getImage(url, res, key);
            } else {
                try {
                    const tsp = parseInt(tspBuf.toString());
                    if (tsp + config.TILES_VALID_FOR * 1000 < Date.now()) {
                        return getImage(url, res, key);
                    }
                } catch (e) {
                    logger.error(e);
                }
            }

            redisClient.get(key, (redisErr, image) => {
                if (redisErr) {
                    logger.error(redisErr);
                }
                if (image) {
                    return send(res, image);
                }

                getImage(url, res, key);
            });
        });
    });

    return router;
}

module.exports = createTileRoute;
