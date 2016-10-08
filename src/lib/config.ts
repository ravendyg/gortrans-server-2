/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const NSK_BASE_URL = 'http://maps.nskgortrans.ru/';

const config: any = {
  PORT: 3013,

  MONGO_HOST: 'mongodb://localhost:27017',
	DB_NAME: 'gortrans2',
	SYNC_COLLECTION_NAME: 'sync',

  PROXY_URL: 'http://localhost:3012/echo',

  NSK_BASE_URL,
  NSK_ROUTES: NSK_BASE_URL + 'listmarsh.php?r&r=true',
  NSK_BUSES:  NSK_BASE_URL + 'markers.php?r=',


  DATA_RETRIEVAL_PERIOD: 1000 * 30, // in miliseconds
  LIST_OF_ROUTES_REFRESH_PERIOD: 1000 * 60 * 60 * 24,
};

export { config };