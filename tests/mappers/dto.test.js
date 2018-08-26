const { assert } = require('chai');

const mappers = require('../../src/lib/mappers/dto');

describe('Routes info mappers', () => {
    it('v2 - should shorten prop names, increase types', () => {
        const routesInfo = [
            {
                type: 0,
                ways: [
                    {
                        marsh: 'marsh11',
                        name: 'names11',
                        stopb: 'stopb11',
                        stope: 'stope11',
                    }, {
                        marsh: 'marsh12',
                        name: 'names12',
                        stopb: 'stopb12',
                        stope: 'stope12',
                    }
                ],
            }, {
                type: 7,
                ways: [
                    {
                        marsh: 'marsh81',
                        name: 'names81',
                        stopb: 'stopb81',
                        stope: 'stope81',
                    }, {
                        marsh: 'marsh82',
                        name: 'names82',
                        stopb: 'stopb82',
                        stope: 'stope82',
                    }
                ],
            }
        ];
        const finalRoutesInfo = mappers.mapV2RoutesInfo(routesInfo);
        assert.deepEqual(finalRoutesInfo, [
            {
                t: 1,
                w: [
                    {
                        e: 'stope11',
                        m: 'marsh11',
                        n: 'names11',
                        s: 'stopb11',
                    }, {
                        e: 'stope12',
                        m: 'marsh12',
                        n: 'names12',
                        s: 'stopb12',
                    }
                ],
            }, {
                t: 8,
                w: [
                    {
                        e: 'stope81',
                        m: 'marsh81',
                        n: 'names81',
                        s: 'stopb81',
                    }, {
                        e: 'stope82',
                        m: 'marsh82',
                        n: 'names82',
                        s: 'stopb82',
                    }
                ],
            }
        ])
    });

    it('v2 - should clean input trass data', () => {
        const trassInput = {
            trasses: [{
                r: [{
                    u: [{
                        lat: '1',
                        lng: '1',
                    }, {
                        id: '1',
                        lat: '1',
                        len: 'qweqwe',
                        lng: '1',
                        n: 'nn',
                    }, {
                        id: '2',
                        lat: '3',
                        lng: '3',
                        n: 'nnwqe',
                        trash: 'qweqwe',
                    }, {
                        lat: '4',
                        len: 'qweqwe',
                        lng: '4',
                    }],
                }],
            }]
        };
        const result = [{
            lat: '1',
            lng: '1',
        }, {
            id: '1',
            lat: '1',
            lng: '1',
            name: 'nn',
        }, {
            id: '2',
            lat: '3',
            lng: '3',
            name: 'nnwqe',
        }, {
            lat: '4',
            lng: '4',
        }];
        assert.deepEqual(mappers.mapV2TrassInfoIncoming(trassInput), result);
    });

    it('v2 - should shorten trass prop names', () => {
        const trassInfo = [{
            lat: '1',
            lng: '1',
        }, {
            id: '1',
            lat: '1',
            lng: '1',
            name: 'nn',
        }, {
            id: '2',
            lat: '3',
            lng: '3',
            name: 'nnwqe',
        }, {
            lat: '4',
            lng: '4',
        }];
        const result = [{
            g: '1',
            t: '1',
        }, {
            g: '1',
            i: '1',
            n: 'nn',
            t: '1',
        }, {
            g: '3',
            i: '2',
            n: 'nnwqe',
            t: '3',
        }, {
            g: '4',
            t: '4',
        }];
        assert.deepEqual(mappers.mapV2TrassInfoOut(trassInfo), result);
    });
})
