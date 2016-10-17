Next iteration of my struggle with maps.nskgortrans.ru.

Plan to centralize data collection and then distribute them using sockets.

Rewrite mobile app using Java.

Use existing Ionic 2 app as a desktop version;

&nbsp;

### Dependecies
node 6.5.0, tsd 0.6.5, gulp

&nbsp;

### Installation
```
npm run setup
```

&nbsp;

### Start
```
npm start
```

##API

Get lis of routes
```
GET /list-of-routes?timestamp

timestamp: number - time of last update provided by the server on the previous call or 0

response:
{
  data:
  {
    routes: ListOfMarh []
  }
}
```