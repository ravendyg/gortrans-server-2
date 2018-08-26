const mapV2RoutesInfo = routesInfo =>
    routesInfo.map(({type, ways}) => ({
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

module.exports = {
    mapV2RoutesInfo,
};
