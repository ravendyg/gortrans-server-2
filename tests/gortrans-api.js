/* global describe, it */
// const assert = require('assert');
const assert = require('chai').assert;

const gortrans = require('../lib/services/nskgortrans');

describe( 'nskgortrans.ru api', function ()
{
  describe( 'get list of routes', function ()
  {
    it( 'shoud return list of bus types with list of routes', function (done)
    {
      this.timeout( 10000 );
      gortrans.getListOfRoutes()
      .then(
        function ( list )
        {
          assert.equal( Array.isArray(list), true );
          assert.equal( list.length > 0, true );

          let keys = Object.keys( list[0] );
          assert.equal( keys[0], 'type' );
          assert.equal( keys[1], 'ways' );

          done();
        }
      )
      .catch(
        function ( err )
        {
          err.should.equal(null);
          done();
        }
      );
    });
  });
});