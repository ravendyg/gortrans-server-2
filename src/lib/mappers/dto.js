const mapV2RoutesInfo = routesInfo =>
    routesInfo.map(({ type, ways }) => ({
        t: type + 1,
        w: ways.map(({
            marsh,
            name,
            stopb,
            stope,
        }) => ({
            e: stope,
            m: marsh,
            n: name,
            s: stopb,
        })),
    }));

const mapV2TrassInfoIncoming = trassInfoRaw => {
    return trassInfoRaw.trasses[0].r[0].u
        .map((item) => {
            let res = { t: item.lat, g: item.lng, };
            const name = item.name || item.n;
            if (name) {
                res.n = name;
            }
            if (item.id) {
                res.i = item.id;
            }
            return res;
        });
}

module.exports = {
    mapV2RoutesInfo,
    mapV2TrassInfoIncoming,
};
