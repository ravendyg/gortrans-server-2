/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const NSK_BASE_URL = 'http://maps.nskgortrans.ru/';

const config: any = {
  PORT: 3013,

  MONGO_HOST: 'mongodb://localhost:27017',
	DB_NAME: 'gortrans2',
	SYNC_COLLECTION_NAME: 'sync',

  PROXY_URL: 'http://192.168.1.121:3012/echo',

  NSK_BASE_URL,
  NSK_ROUTES:   NSK_BASE_URL + 'listmarsh.php?r&r=true',
  NSK_BUSES:    NSK_BASE_URL + 'markers.php?r=',
  NSK_TRASSES:  NSK_BASE_URL + 'trasses.php?r=',


  DATA_RETRIEVAL_PERIOD: 1000 * 30, // in miliseconds
  LIST_OF_ROUTES_REFRESH_PERIOD: 1000 * 60 * 60 * 24,

  TRASS_DATA_VALID_FOR: 1000 * 60 * 60 * 24,

  TEST_BUSES_FOO: (e: any) => e.match(/1-036-W/) || e.match(/1-045-W/) || e.match(/1-264-W/) ||
    e.match(/2-2-W-2/) || e.match(/3-0013-W-13/) || e.match(/8-7-W-7/)
};

export { config };