/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const NSK_BASE_URL = 'http://maps.nskgortrans.ru/';

const config: any = {
  PORT: 3013,

  PROXY_URL: 'http://api.nskgortrans.info/echo',

  NSK_BASE_URL,
  NSK_ROUTES: NSK_BASE_URL + 'listmarsh.php?r&r=true',
  NSK_BUSES:  NSK_BASE_URL + 'markers.php?r=',


  DATA_RETRIEVAL_PERIOD: 1000 * 30, // in miliseconds
};

export { config };