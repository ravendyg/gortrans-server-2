'use strict';

const mongoose = require('mongoose');
const bluebird = require('bluebird');

const config = require('../config');


// function putRoutes( routes, timestamp )
// {
//   DB.then(
//     (db) =>
//     {
//       db.collection(config.SYNC_COLLECTION_NAME).update(
// 				{type: 'routes'},
// 				{
// 					$set:
// 					{
// 						type: 'routes',
// 						timestamp,
// 						routes
// 					}
// 				},
// 				{ upsert: true },
// 				updateErrorHandler
// 			);
//     }
//   );
// }

// function getRoutes( timestamp )
// {
//   function main (resolve, reject)
// 	{
// 		DB
// 		.then(
// 			(db) =>
// 				db.collection(config.SYNC_COLLECTION_NAME).findOne(
// 					{
// 						type: 'routes',
// 						timestamp: { $gt: timestamp }
// 					},
// 					(err, res) =>
// 					{
// 						if (err) { reject(err); }
//             else if (res) { resolve( res ); }
// 						else { resolve(''); }
// 					}
// 				)
// 		)
// 		.catch(
//       (err) => reject(err)
// 		)
// 		;
// 	}

// 	return new bb( main );
// }


// function putTrasses( trass, busCode, timestamp )
// {
//   DB.then(
//     (db) =>
//     {
//       db.collection(config.SYNC_COLLECTION_NAME)
//       .update(
//         {
//           type: 'trasses',
//           busCode
//         },
//         {
//           $set:
//           {
//             type: 'trasses',
//             timestamp,
//             busCode,
//             trass
//           }
//         },
//         { upsert: true },
//         updateErrorHandler
//       );
//     }
//   );
// }

// function getTrass( timestamp, busCode )
// {
//   function main (resolve, reject)
// 	{
// 		DB.then(
// 			(db) =>
// 				db.collection(config.SYNC_COLLECTION_NAME).findOne(
// 					{
//             type: 'trasses',
//             timestamp: { $gt: timestamp },
//             busCode
//           },
//           { trass: 1, timestamp: 1 },
// 					(err, res) =>
// 					{
// 						if (err)
//             {
//               console.error(err, 'getTrasses');
//               resolve({trass: '', timestamp: 0});
//             }
//             else if (res) { resolve( res ); }
// 						else { resolve({trass: '', timestamp}); }
// 					}
// 				)
// 		)
// 		.catch(
//       (err) => reject(err)
// 		)
// 		;
// 	}

// 	return new bb( main );
// }

// function getTrasses(timestamp)
// {
//   return DB.then(
//     (db) =>
//       db.collection(config.SYNC_COLLECTION_NAME)
//       .find(
//         {
//           type: 'trasses',
//           timestamp: { $gt: timestamp }
//         },
//         { trass: 1, busCode: 1, _id: 0 }
//       )
//       .toArray()
//   );
// }

// function getLatestTrass()
// {
//   function main( resolve )
//   {
//     DB.then(
//       (db) =>
//       {
//         db.collection(config.SYNC_COLLECTION_NAME)
//         .find( {type: 'trasses'}, {trass: 0} )
//         .sort({timestamp: -1})
//         .limit(1)
//         .nextObject(
//           (err, item) =>
//           {
//             if ( err )
//             {
//               console.error( err, 'getLatestTrass');
//               resolve({timestamp: 0});
//             }
//             else
//             {
//               resolve( item );
//             }
//           }
//         );
//       }
//     );
//   }
//   return new bb( main );
// }

// function putStopsInDb(
//   stopsDb, busStopsDb,
//   timestamp
// )
// {
//   DB.then(
//     (db) =>
//     {
//       db.collection(config.SYNC_COLLECTION_NAME)
//       .update(
//         {
//           type: 'stops'
//         },
//         {
//           $set:
//           {
//             type: 'stops',
//             timestamp,
//             stopsDb,
//             busStopsDb
//           }
//         },
//         { upsert: true },
//         updateErrorHandler
//       );
//     }
//   );
// }

// function getStops()
// {
//   function main( resolve )
//   {
//     DB.then(
//       (db) =>
//         db.collection(config.SYNC_COLLECTION_NAME)
//         .findOne(
//           {
//             type: 'stops'
//           },
//           { type: 0, _id: 0 },
//           (err, res) =>
//           {
//             if ( err )
//             {
//               console.error( err, 'getLatestTrass');
//               resolve({stopsDb: {}, busStopsDb: {}, timestamp: 0});
//             }
//             else
//             {
//               resolve(res || {stopsDb: {}, busStopsDb: {}, timestamp: 0});
//             }
//           }
//         )
//     );
//   }
//   return new bb( main );
// }

// function updateErrorHandler( err )
// {
//   if ( err ) { console.error(err); }
// }