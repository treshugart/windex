var headers = { 'Content-Type': 'application/json' }
  , response = '{ "test": true }';

describe('Creation', function() {
  var windex;

  beforeEach(function() {
    windex = Windex.create();
  });

  it('Should createa new instance.', function() {
    windex.should.be.instanceof(Windex);
  });

  it('Should set good default options.', function() {
    windex.cache.should.equal(false);
    windex.headers.Accept.should.equal('application/json');
    windex.parsers['application/json'].should.be.a('function');
    windex.prefix.should.equal('/');
    windex.suffix.should.equal('');
  });
});

describe('Serialisation', function() {
  var windex;

  beforeEach(function() {
    windex = Windex.create();
  });

  it('Should serialize an object of options into a query string.', function() {
    var data = windex.serialize({
      test1: 'string',
      test2: 10,
      test3: true,
      test4: false,
      test5: ['test1', 'test2'],
      test6: {
        test1: 'test1',
        test2: 'test2'
      }
    });
    data.should.be.a('string');
    data.should.equal('test1=string&test2=10&test3=true&test4=false&test5%5B0%5D=test1&test5%5B1%5D=test2&test6%5Btest1%5D=test1&test6%5Btest2%5D=test2');
  });
});

describe('Requesting', function() {
  var windex
    , server;

  beforeEach(function() {
    windex = Windex.create();
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  it('Should make an asynchronous request.', function(done) {
    windex.request('GET test').then(function(r) {
      r.should.be.an('object');
      r.test.should.equal(true);
      done();
    });

    server.requests[0].respond(200, headers, response);
  });

  !function() {
    var types = ['get', 'post', 'put', 'delete', 'patch', 'options', 'trace', 'head', 'connect']
      , arrTypes = types.map(function(s) {
          return s.toUpperCase();
        })
      , strTypes = arrTypes.slice(0, arrTypes.length - 1).join(', ') + ' and ' + arrTypes[arrTypes.length - 1];

    it('Should support ' + strTypes + ' requests.', function(done) {
      for (var a = 0; a < types.length; a++) {
        windex[types[a]]('someurl').then(function(r) {
          r.should.be.an('object');
          r.test.should.equal(true);
          done();
        });

        server.requests[a].respond(200, headers, response);
      }
    });
  }();

  it('Should support custom prefixes and suffixes.', function(done) {
    windex.prefix = '/my-test-prefix/';
    windex.suffix = '.json';

    server.respondWith('GET', /^\/my\-test\-prefix\/test\.json/, [200, headers, response]);

    windex.get('test').then(function(r) {
      r.should.be.an('object');
      r.test.should.equal(true);
      done();
    });

    server.respond();
  });

  it('Should add a cache breaking parameter if caching is disabled.', function(done) {
    server.respondWith('GET', /^\/test\?_/, [200, headers, response]);

    windex.get('test').then(function(r) {
      r.should.be.an('object');
      r.test.should.equal(true);
      done();
    });

    server.respond();
  });

  it('Should not add a cache breaking parameter if caching is enabled.', function(done) {
    windex.cache = true;

    server.respondWith('GET', /^\/test$/, [200, headers, response]);

    windex.get('test').then(function(r) {
      r.should.be.an('object');
      r.test.should.equal(true);
      done();
    });

    server.respond();
  });
});

describe('Proxies', function() {
  var windex
    , server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
    windex = Windex.create();
  });

  afterEach(function() {
    server.restore();
  });

  it('Should create a function that calls a URL with the arguments provided as data and return a promise.', function(done) {
    var proxy = windex.proxy('GET :action', { action: 'default' });
    windex.suffix = '.json';

    server.respondWith('GET', /^\/default.json/, [200, headers, '{ "action": "default" }']);
    server.respondWith('GET', /^\/modified.json/, [200, headers, '{ "action": "modified" }']);

    Q.all([
      proxy(),
      proxy({ action: 'modified' })
    ]).then(function(r) {
      r[0].action.should.equal('default');
      r[1].action.should.equal('modified');
      done();
    });

    server.respond();
  });
});