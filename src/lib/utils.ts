/// <reference path="../lib/index.d.ts" />
'use strict';

function hasKeys( obj: any ): boolean
{
	return Object.keys( obj ).length > 0;
}

function flatArrayToDict( acc: any, e: any): any
{
	for ( let key of Object.keys(e) )
	{
		acc[ key ] = e[ key ].reduce( busListToDict, {} );
	}
	return acc;
}

function busListToDict( acc: any, bus: busData ): any
{
	acc[ bus.graph ] = bus;
	return acc;
}


const utils: any =
{
  hasKeys, flatArrayToDict
};

export { utils };