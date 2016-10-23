/// <reference path="../index.d.ts" />
'use strict';

const bb = require('bluebird');
const MongoClient = require('mongodb').MongoClient;

import {Promise} from 'es6-promise';
import { config } from '../config';
import { errServ } from '../error';

const DB = mainDb();

const db =
{
  putRoutes, getRoutes,
  putTrasses, getTrass, getTrasses, getLatestTrass,
  putStopsInDb, getStops
};

export { db };

function mainDb()
{
	function main( resolve: any, reject: any)
	{
		MongoClient.connect(
			config.MONGO_HOST + '/' + config.DB_NAME,
			(err: Error, database: any) =>
			{
				if (database) { resolve(database); }
				else if (err) { reject(err); }
				else
				{
					reject('wtf');
					console.error('db wtf', err, database);
				}
			}
		);
	}
	return new bb( main );
}

function putRoutes( routes: string, timestamp: number )
{
  DB.then(
    (db: any) =>
    {
      db.collection(config.SYNC_COLLECTION_NAME).update(
				{type: 'routes'},
				{
					$set:
					{
						type: 'routes',
						timestamp,
						routes
					}
				},
				{ upsert: true },
				updateErrorHandler
			);
    }
  );
}

function getRoutes( timestamp: number ): Promise<{routes: string, timestamp: number}>
{
  function main (resolve: any, reject: any)
	{
		DB
		.then(
			(db: any) =>
				db.collection(config.SYNC_COLLECTION_NAME).findOne(
					{
						type: 'routes',
						timestamp: { $gt: timestamp }
					},
					(err: Error, res: any) =>
					{
						if (err) { reject(err); }
            else if (res) { resolve( res ); }
						else { resolve(''); }
					}
				)
		)
		.catch(
      (err: Error) => reject(err)
		)
		;
	}

	return new bb( main );
}


function putTrasses( trass: string, busCode: string, timestamp: number )
{
  DB.then(
    (db: any) =>
    {
      db.collection(config.SYNC_COLLECTION_NAME)
      .update(
        {
          type: 'trasses',
          busCode
        },
        {
          $set:
          {
            type: 'trasses',
            timestamp,
            busCode,
            trass
          }
        },
        { upsert: true },
        updateErrorHandler
      );
    }
  );
}

function getTrass( timestamp: number, busCode: string ): Promise<{trass: string, timestamp: number}>
{
  function main (resolve: any, reject: any)
	{
		DB.then(
			(db: any) =>
				db.collection(config.SYNC_COLLECTION_NAME).findOne(
					{
            type: 'trasses',
            timestamp: { $gt: timestamp },
            busCode
          },
          { trass: 1, timestamp: 1 },
					(err: Error, res: {trass: string, timestamp: number}) =>
					{
						if (err)
            {
              console.error(err, 'getTrasses');
              resolve({trass: '', timestamp: 0});
            }
            else if (res) { resolve( res ); }
						else { resolve({trass: '', timestamp}); }
					}
				)
		)
		.catch(
      (err: Error) => reject(err)
		)
		;
	}

	return new bb( main );
}

function getTrasses(timestamp: number):
  Promise<{trass: string, timestamp: number} []>
{
  return DB.then(
    (db: any) =>
      db.collection(config.SYNC_COLLECTION_NAME)
      .find(
        {
          type: 'trasses',
          timestamp: { $gt: timestamp }
        },
        { trass: 1, busCode: 1, _id: 0 }
      )
      .toArray()
  );
}

function getLatestTrass(): Promise<any>
{
  function main( resolve: any )
  {
    DB.then(
      (db: any) =>
      {
        db.collection(config.SYNC_COLLECTION_NAME)
        .find( {type: 'trasses'}, {trass: 0} )
        .sort({timestamp: -1})
        .limit(1)
        .nextObject(
          (err: Error, item: any) =>
          {
            if ( err )
            {
              console.error( err, 'getLatestTrass');
              resolve({timestamp: 0});
            }
            else
            {
              resolve( item );
            }
          }
        );
      }
    );
  }
  return new bb( main );
}

function putStopsInDb(
  stopsDb: { [stopId: string]: Stop }, busStopsDb: BusStops,
  timestamp: number
): void
{
  DB.then(
    (db: any) =>
    {
      db.collection(config.SYNC_COLLECTION_NAME)
      .update(
        {
          type: 'stops'
        },
        {
          $set:
          {
            type: 'stops',
            timestamp,
            stopsDb,
            busStopsDb
          }
        },
        { upsert: true },
        updateErrorHandler
      );
    }
  );
}

function getStops():
  Promise<{stopsDb: { [stopId: string]: Stop }, busStopsDb: BusStops, timestamp: number}>
{
  function main( resolve: any )
  {
    DB.then(
      (db: any) =>
        db.collection(config.SYNC_COLLECTION_NAME)
        .findOne(
          {
            type: 'stops'
          },
          { type: 0, _id: 0 },
          (err: Error, res: any) =>
          {
            if ( err )
            {
              console.error( err, 'getLatestTrass');
              resolve({stopsDb: {}, busStopsDb: {}, timestamp: 0});
            }
            else
            {
              resolve(res || {stopsDb: {}, busStopsDb: {}, timestamp: 0});
            }
          }
        )
    );
  }
  return new bb( main );
}

function updateErrorHandler( err: Error )
{
  if ( err ) { console.error(err); }
}