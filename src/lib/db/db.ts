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
  putTrasses, getTrasses
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

function getRoutes( timestamp: number ): Promise<string>
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
            else if (res) { resolve( res.routes ); }
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

function getTrasses(
  {timestamp, busCode}:
  {timestamp: number, busCode?: string}
): Promise<{trass: string, timestamp: number}>
{
  function main (resolve: any, reject: any)
	{
    let query: any =
    {
      type: 'trasses',
      timestamp: { $gt: timestamp }
    };
    if ( busCode )
    {
      query.busCode = busCode;
    }

		DB.then(
			(db: any) =>
				db.collection(config.SYNC_COLLECTION_NAME).findOne(
					query,
          { trass: 1, timestamp: 1 },
					(err: Error, res: {trass: string, timestamp: number}) =>
					{
						if (err)
            {
              console.error(err, 'getTrasses');
              resolve({trass: '', timestamp: 0});
            }
            else if (res) { resolve( res ); }
						else { resolve({trass: '', timestamp: 0}); }
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

function updateErrorHandler( err: Error )
{
	if ( err ) { console.error(err); }
}