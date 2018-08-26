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
            let res = { lat: item.lat, lng: item.lng, };
            if (item.n) {
                res.name = item.n;
            }
            if (item.id) {
                res.id = item.id;
            }
            return res;
        });
}

const mapV2TrassInfoOut = trassInfo => {
    return trassInfo
        .map((item) => {
            let res = { g: item.lng, t: item.lat, };
            if (item.name) {
                res.n = item.name;
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
    mapV2TrassInfoOut,
};
