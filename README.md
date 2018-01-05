Next iteration of my struggle with maps.nskgortrans.ru.

Trying to rewrite everything - this one is not supported. All changes are just hot fixes to make it survive for a while.

&nbsp;

### Dependecies
node 8.*.*

&nbsp;

### Installation
```
npm i
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
