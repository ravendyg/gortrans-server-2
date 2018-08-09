const request = require('request');

const config = require('../config');

function getRoutesInfo() {
    return new Promise((resolve, reject) => {
        request(
            {
                url: config.PROXY_URL,
                method: 'GET',
                headers: {
                    'x-auth-token': config.API_KEY,
                    url: config.NSK_ROUTES,
                },
            },
            getRoutesInfoHandler.bind(this, resolve, reject)
        );
    });
}

function getRoutesInfoHandler(resolve, reject, httpErr, httpResponse, body) {
    if (httpErr) {
        return reject(httpErr);
    } else if (httpResponse.statusCode !== 200) {
        return reject(new Error(
            `getRoutesInfo: status code ${httpResponse.statusCode} - ${(body || '').slice(0, 100)}`
        ));
    } else {
        try {
            let routes = JSON.parse(body);
            resolve(routes);
        } catch (_err) {
            return reject(new Error(
                `getRoutesInfo: parse error - ${body}`
            ));
        }
    }
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

module.exports = {
    getRoutesInfo,
};
