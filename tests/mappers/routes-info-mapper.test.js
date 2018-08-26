const { assert } = require('chai');

const routesInfoMappers = require('../../src/lib/mappers/routes-info');

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
        const finalRoutesInfo = routesInfoMappers.mapV2RoutesInfo(routesInfo);
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
})
