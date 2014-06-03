module.exports = function (grunt) {
  return {
    options: {
      hostname: grunt.option('host') || 'localhost',
      port: grunt.option('port') || '9876',
      browsers: ['PhantomJS'],
      files: [
        'bower_components/q/q.js',
        'src/windex.js',
        'test/windex.js'
      ],
      frameworks: [
        'mocha',
        'sinon'
      ],
      plugins: [
        'karma-mocha',
        'karma-phantomjs-launcher',
        'karma-sinon'
      ],
      singleRun: true
    },
    cli: {},
    http: {
      singleRun: false
    }
  };
};
