'use strict';
var GulpConfig = (function () {
  function gulpConfig() {
    this.source = './src/';
    // this.sourceApp = this.source + 'app/';
    this.tsOutputPath = './build';
    this.allJavaScript = ['./build/**/*.js'];
    this.allTypeScript = this.source + '/**/*.ts';
    this.typings = './typings/';
    this.libraryTypeScriptDefinitions = './typings/tsd.d.ts';
  }
  return gulpConfig;
})();
module.exports = GulpConfig;
