function generateTileUrl(node, chunks) {
    // 17/95772/41550.png
    return `https://${node}.basemaps.cartocdn.com/light_all/${chunks.join('/')}`;
}

function createTileRoute({
    express,
    redis,
    request,
}) {
    const router = new express.Router();

    router.get('*', (req, res) => {
        const [node, ...chunks] = req.url.split('/').slice(1);
        const url = generateTileUrl(node, chunks);
        request({
            method: 'GET',
            url,
            encoding: null,
        }, (err, resp) => {
            Object.keys(resp.headers).forEach(key => {
                res.setHeader(key, resp.headers[key]);
            });
            res.send(resp.body);
        });
    });

    return router;
}

module.exports = createTileRoute;
