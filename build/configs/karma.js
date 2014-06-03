module.exports = {
  options: {
    browsers: ['PhantomJS'],
    files: [
      'bower_components/q/q.js',
      'src/windex.js',
      'test/windex.js'
    ],
    frameworks: [
      'chai',
      'mocha',
      'sinon'
    ],
    plugins: [
      'karma-chai',
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
