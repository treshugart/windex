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
    data.should.equal('test1=string&test2=10&test3=true&test4=false&test5[0]=test1&test5[1]=test2&test6[test1]=test1&test6[test2]=test2');
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

describe('Urls', function() {
  var windex
    , server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
    windex = Windex.create();
  });

  afterEach(function() {
    server.restore();
  });

  it('Should allow a URL to be passed in.', function() {
    windex.url('get test').type.should.equal('GET');
    windex.url('GET test').type.should.equal('GET');
    windex.url('GET test').uri.should.equal('test');
  });

  it('Should allow default replacements to be passed in when formatting.', function() {
    windex.url('GET :action').toString({ action: 'test' }).should.equal('GET test');
  });

  it('Should allow toString conversion.', function() {
    var url = windex.url('GET test');
    url.toString().should.equal(('' + url));
  });

  it('Should allow defaults to be set using a method.', function() {
    windex.url().use({ test: true }).defaults.test.should.equal(true);
  });

  it('Should create a function that calls a URL with the arguments provided as data and return a promise.', function(done) {
    var url = windex.url('GET :action', { action: 'default' });
    windex.suffix = '.json';

    server.respondWith('GET', /^\/default.json/, [200, headers, '{ "action": "default" }']);
    server.respondWith('GET', /^\/modified.json/, [200, headers, '{ "action": "modified" }']);

    Q.all([
      url.now(),
      url.now({ action: 'modified' })
    ]).then(function(r) {
      r[0].action.should.equal('default');
      r[1].action.should.equal('modified');
      done();
    });

    server.respond();
  });

  it('Should allow programmatic building of the URL.', function() {
    windex.url().one('user').toString().should.equal('GET user/:user');
    windex.url().many('users').toString().should.equal('GET users/:limit/:page');
    windex.url().all('users').toString().should.equal('GET users');
    windex.url().one('blog').many('comments').toString().should.equal('GET blog/:blog/comments/:limit/:page');
    windex.url().one('blog').all('comments').toString().should.equal('GET blog/:blog/comments');

    windex.url().get.one('blog').toString().should.equal('GET blog/:blog');
    windex.url().get.one('blog').and.add.to.all('comments').toString().should.equal('POST blog/:blog/comments');
    windex.url().get.one('blog').and.update.one('comment').toString().should.equal('PATCH blog/:blog/comment/:comment');
    windex.url().get.one('blog').and.replace.one('comment').toString().should.equal('PUT blog/:blog/comment/:comment');
    windex.url().get.one('blog').and.delete.one('comment').toString().should.equal('DELETE blog/:blog/comment/:comment');
  });

  it('Should remove empty parameters for :limit and :page.', function() {
    windex.url().many('users').toString({}).should.equal('GET users');
    windex.url().many('users').toString({ limit: 10 }).should.equal('GET users/10');
    windex.url().many('users').toString({ limit: 10, page: 1 }).should.equal('GET users/10/1');
  });

  it('Should not encode parameters.', function() {
    windex.url().one('user').toString({ user: 'Your Name' }).should.equal('GET user/Your Name');
  });
});

describe('Generation', function() {
  var windex
    , server;

  beforeEach(function() {
    windex = Windex.create();
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  it('Should return a constructor with a generated prototype when one argument is passed.', function() {
    var Repo = windex.gen({
      create: 'POST users',
      getAll: ['GET users', { test: true }]
    });

    Repo.prototype.create.url.toString().should.equal('POST users');
    Repo.prototype.getAll.url.toString().should.equal('GET users');
    Repo.prototype.getAll.url.defaults.test.should.equal(true);
  });

  it('Should modify a constructor prototype when two or more arguments are passed.', function() {
    var Repo = windex.gen(function() {}, {
      create: 'POST users'
    }, {
      getAll: ['GET users', { test: true }]
    });

    Repo.prototype.create.url.toString().should.equal('POST users');
    Repo.prototype.getAll.url.toString().should.equal('GET users');
    Repo.prototype.getAll.url.defaults.test.should.equal(true);
  });
});

describe('Mocking - Instance-Level', function() {
  var windex;

  beforeEach(function() {
    windex = Windex.create();
  });

  it ('Should support string matching.', function(done) {
    windex.stub('GET test', { data: true });
    windex.request('GET test').then(function(r) {
      r.data.should.equal(true);
      done();
    });
  });

  it('Should support regex matching.', function(done) {
    windex.stub(/test/, { data: true });
    windex.request('GET test').then(function(r) {
      r.data.should.equal(true);
      done();
    });
  });

  it('Should allow a function to be specified instead of a string.', function(done) {
    windex.stub(/test/, function() {
      return { data: true };
    });
    windex.request('GET test').then(function(r) {
      r.data.should.equal(true);
      done();
    });
  });

  it('Should pass the pattern matches to the data function.', function(done) {
    windex.stub(/(test)/, function(uri, test) {
      return { uri: uri, test: test };
    });
    windex.request('GET test').then(function(r) {
      r.uri.should.equal('test');
      r.test.should.equal('test');
      done();
    });
  });

});

describe('POST data accessible in stubs', function() {
  var windex;
  var service = 'POST security/authenticate';
  var success = 'authentication successfull';
  var fail = 'authentication fails for user: ';

  beforeEach(function() {
    windex = Windex.create();
    windex.stub(service, function(uri, user) {
      var status = user.email === 'beta@test.com' && user.password === 'beta';
      return { status: status, message: status ? success : fail + user.email };
    });
  });

  it('Should pass the POST data to the stub handler.', function(done) {
    var user =  { email: 'beta@test.com', password: 'beta' };
    windex.request(service, user).then(function(r) {
      r.status.should.equal(true);
      r.message.should.equal(success);
      done();
    });
  });

  it('Should pass the POST data to the stub handler. (false positive)', function(done) {
    var user = { email: 'beta1@test.com', password: 'beta' };
    windex.request(service, user).then(function(r) {
      r.status.should.equal(false);
      r.message.should.equal(fail + user.email);
      done();
    });
  });

  it('Should pass the POST data to the stub handler. (false positive)', function(done) {
    var user = { email: 'beta@test.com', password: 'beta1' };
    windex.request(service, user).then(function(r) {
      r.status.should.equal(false);
      r.message.should.equal(fail + user.email);
      done();
    });
  });

});
