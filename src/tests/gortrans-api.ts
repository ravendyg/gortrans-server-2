/// <reference path="../../typings/tsd.d.ts" />
'use strict';
/* global describe, it */

const assert = require('chai').assert;

import { gortrans } from '../lib/services/nskgortrans';

describe( 'nskgortrans.ru api', function ()
{
  describe( 'get list of routes', function ()
  {
    it( 'shoud return list of bus types with list of routes', function (done: any)
    {
      this.timeout( 10000 );
      gortrans.getListOfRoutes()
      .then(
        function ( list: ListMarsh [] )
        {
          assert.equal( Array.isArray(list), true );
          assert.equal( list.length > 0, true );

          let keys: string [] = Object.keys( list[0] );
          assert.equal( keys[0], 'type' );
          assert.equal( keys[1], 'ways' );

          done();
        }
      )
      .catch(
        function ( err: Error )
        {
          err.should.equal(null);
          done();
        }
      );
    });
  });

  describe( 'get list of buses', function ()
  {
    it( 'shoud return list of buses', function ( done: any )
    {
      this.timeout( 10000 );
      gortrans.getListOfAvailableBuses('1-045-W-45')
      .then(
        function ( list: indexedBusData )
        {
          assert.isDefined( list['1-045-W-45'] );
          assert.equal( list['1-045-W-45'].length > 0, true );
          assert.equal( list['1-045-W-45'][0]['marsh'], '045' );
          assert.equal( list['1-045-W-45'][0]['title'], '45' );

          done();
        }
      )
      .catch(
        function ( err: Error )
        {
          err.should.equal(null);
          done();
        }
      );
    });
  });
});