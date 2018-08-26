function createGortransService({
    config,
    logger,
    request,
}) {
    function getRoutesInfo() {
        return new Promise(resolve => {
            request(
                {
                    headers: {
                        url: config.NSK_ROUTES,
                        'x-auth-token': config.API_KEY,
                    },
                    method: 'GET',
                    url: config.PROXY_URL,
                },
                getRoutesInfoHandler.bind(this, resolve)
            );
        });
    }

    function getRoutesInfoHandler(resolve, httpErr, httpResponse, body) {
        if (httpErr) {
            logger.error(httpErr);
            return resolve(null);
        } else if (httpResponse.statusCode !== 200) {
            logger.error(`getRoutesInfo: status code ${httpResponse.statusCode} - ${(body || '').slice(0, 100)}`);
            return resolve(null);
        } else {
            try {
                let routes = JSON.parse(body);
                resolve(routes);
            } catch (_err) {
                logger.error(`getRoutesInfo: parse error - ${body}`);
                return resolve(null);
            }
        }
    }

    return {
        getRoutesInfo,
    };
}

// function getRoutesInfo(codes) {
//     return new Promise((resolve, reject) => {
//         request(
//             {
//                 url: config.PROXY_URL,
//                 method: 'GET',
//                 headers: {
//                     'x-auth-token': config.API_KEY,
//                     url: config.NSK_BUSES + codes,
//                 },
//             },
//             getRoutesInfoHandler.bind(this, resolve, reject, codes)
//         );
//     });
// }

// function getRoutesInfoHandler(
//     resolve, reject, codesQuery,
//     httpErr, httpResponse, body
// ) {
//     if (httpErr) {
//         return reject(httpErr);
//     } else if (httpResponse.statusCode !== 200) {
//         return reject(new Error(
//             `getRoutesInfo: status code ${httpResponse.statusCode} - ${(body || '').slice(0, 100)}`
//         ));
//     } else {
//         try {
//             let data = JSON.parse(body).markers;
//             debugger;
//             var out =
//                 data
//                     .reduce(
//                         (acc, e) => {
//                             let code = e.id_typetr + '-' + e.marsh + '-W-' + e.title;
//                             acc[code] = acc[code] ? acc[code].concat(e) : [e];
//                             return acc;
//                         },
//                         {}
//                     );

//             let codes = codesQuery.split('|');
//             for (let code of codes) { // in case there were no markers for this bus
//                 if (!out[code]) {
//                     out[code] = [];
//                 }
//             }

//             resolve(out);
//         } catch (parseError) {
//             return reject(parseError);
//         }
//     }
// }

module.exports = createGortransService;
