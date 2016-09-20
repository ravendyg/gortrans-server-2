const NSK_BASE_URL = 'http://maps.nskgortrans.ru/';

module.exports =
{
  PORT: 3012,
  TOR_PORTS: [ 9060, 9062, 9064, 9066, 9068 ],

  PROXY_URL: 'http://api.nskgortrans.info/echo',

  NSK_BASE_URL,
  NSK_ROUTES: NSK_BASE_URL + 'listmarsh.php?r&r=true',
};