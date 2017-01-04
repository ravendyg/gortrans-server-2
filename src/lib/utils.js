'use strict';

function hasKeys( obj )
{
	return Object.keys( obj ).length > 0;
}

function flatArrayToDict( acc, e)
{
	for ( let key of Object.keys(e) )
	{
		acc[ key ] = e[ key ].reduce( busListToDict, {} );
	}
	return acc;
}

function busListToDict(acc, bus)
{
	acc[ bus.graph ] = bus;
	return acc;
}


const utils =
{
  hasKeys, flatArrayToDict
};

module.exports = utils;