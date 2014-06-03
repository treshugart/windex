(function () {
  'use strict';

  var headers = { 'Content-Type': 'application/json' };
  var response = '{ "test": true }';

  describe('Creation', function() {
    var windex;

    beforeEach(function() {
      windex = Windex.create();
    });

    it('Should createa new instance.', function() {
      assert(windex instanceof Windex);
    });

    it('Should set good default options.', function() {
      assert(windex.cache === false);
      assert(windex.headers.Accept === 'application/json');
      assert(typeof windex.parsers['application/json'] === 'function');
      assert(windex.prefix === '/');
      assert(windex.suffix === '');
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
      assert(typeof data === 'string');
      assert(data === 'test1=string&test2=10&test3=true&test4=false&test5[0]=test1&test5[1]=test2&test6[test1]=test1&test6[test2]=test2');
    });

    it('Should encode each uri value.', function () {
      var data = windex.serialize({
        test: 'some [ value ] that includes many characters & data'
      });
      assert(data === 'test=some%20%5B%20value%20%5D%20that%20includes%20many%20characters%20%26%20data');
    });
  });

  describe('Requesting', function() {
    var windex;
    var server;

    beforeEach(function() {
      windex = Windex.create();
      server = sinon.fakeServer.create();
    });

    afterEach(function() {
      server.restore();
    });

    it('Should make an asynchronous request.', function(done) {
      windex.request('GET test').then(function(r) {
        assert(typeof r === 'object');
        assert(r.test === true);
        done();
      });

      server.requests[0].respond(200, headers, response);
    });

    !function() {
      var types = ['get', 'post', 'put', 'delete', 'patch', 'options', 'trace', 'head', 'connect'];
      var arrTypes = types.map(function(s) {
            return s.toUpperCase();
          });
      var strTypes = arrTypes.slice(0, arrTypes.length - 1).join(', ') + ' and ' + arrTypes[arrTypes.length - 1];

      it('Should support ' + strTypes + ' requests.', function(done) {
        for (var a = 0; a < types.length; a++) {
          windex[types[a]]('someurl').then(function(r) {
            assert(typeof r === 'object');
            assert(r.test === true);
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
        assert(r.test === true);
        done();
      });

      server.respond();
    });

    it('Should add a cache breaking parameter if caching is disabled.', function(done) {
      server.respondWith('GET', /^\/test\?_/, [200, headers, response]);

      windex.get('test').then(function(r) {
        assert(r.test === true);
        done();
      });

      server.respond();
    });

    it('Should not add a cache breaking parameter if caching is enabled.', function(done) {
      windex.cache = true;

      server.respondWith('GET', /^\/test$/, [200, headers, response]);

      windex.get('test').then(function(r) {
        assert(typeof r === 'object');
        assert(r.test === true);
        done();
      });

      server.respond();
    });
  });

  describe('Urls', function() {
    var windex;
    var server;

    beforeEach(function() {
      server = sinon.fakeServer.create();
      windex = Windex.create();
    });

    afterEach(function() {
      server.restore();
    });

    it('Should allow a URL to be passed in.', function() {
      assert(windex.url('get test').type === 'GET');
      assert(windex.url('GET test').type === 'GET');
      assert(windex.url('GET test').uri === 'test');
    });

    it('Should allow default replacements to be passed in when formatting.', function() {
      assert(windex.url('GET :action').toString({ action: 'test' }) === 'GET test');
    });

    it('Should allow toString conversion.', function() {
      var url = windex.url('GET test');
      assert(url.toString() === ('' + url));
    });

    it('Should allow defaults to be set using a method.', function() {
      assert(windex.url().use({ test: true }).defaults.test === true);
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
        assert(r[0].action === 'default');
        assert(r[1].action === 'modified');
        done();
      });

      server.respond();
    });

    it('Should allow programmatic building of the URL.', function() {
      assert(windex.url().one('user').toString() === 'GET user/:user');
      assert(windex.url().many('users').toString() === 'GET users/:limit/:page');
      assert(windex.url().all('users').toString() === 'GET users');
      assert(windex.url().one('blog').many('comments').toString() === 'GET blog/:blog/comments/:limit/:page');
      assert(windex.url().one('blog').all('comments').toString() === 'GET blog/:blog/comments');

      assert(windex.url().get.one('blog').toString() === 'GET blog/:blog');
      assert(windex.url().get.one('blog').and.add.to.all('comments').toString() === 'POST blog/:blog/comments');
      assert(windex.url().get.one('blog').and.update.one('comment').toString() === 'PATCH blog/:blog/comment/:comment');
      assert(windex.url().get.one('blog').and.replace.one('comment').toString() === 'PUT blog/:blog/comment/:comment');
      assert(windex.url().get.one('blog').and.delete.one('comment').toString() === 'DELETE blog/:blog/comment/:comment');
    });

    it('Should remove empty parameters for :limit and :page.', function() {
      assert(windex.url().many('users').toString({}) === 'GET users');
      assert(windex.url().many('users').toString({ limit: 10 }) === 'GET users/10');
      assert(windex.url().many('users').toString({ limit: 10, page: 1 }) === 'GET users/10/1');
    });

    it('Should encode special characters.', function () {
      assert(windex.url().one('user').toString({ user: '#' }) === 'GET user/%23');
    });
  });

  describe('Generation', function() {
    var windex;
    var server;

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

      assert(Repo.prototype.create.url.toString() === 'POST users');
      assert(Repo.prototype.getAll.url.toString() === 'GET users');
      assert(Repo.prototype.getAll.url.defaults.test === true);
    });

    it('Should modify a constructor prototype when two or more arguments are passed.', function() {
      var Repo = windex.gen(function() {}, {
        create: 'POST users'
      }, {
        getAll: ['GET users', { test: true }]
      });

      assert(Repo.prototype.create.url.toString() === 'POST users');
      assert(Repo.prototype.getAll.url.toString() === 'GET users');
      assert(Repo.prototype.getAll.url.defaults.test === true);
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
        assert(r.data === true);
        done();
      });
    });

    it('Should support regex matching.', function(done) {
      windex.stub(/test/, { data: true });
      windex.request('GET test').then(function(r) {
        assert(r.data === true);
        done();
      });
    });

    it('Should allow a function to be specified instead of a string.', function(done) {
      windex.stub(/test/, function() {
        return { data: true };
      });
      windex.request('GET test').then(function(r) {
        assert(r.data === true);
        done();
      });
    });

    it('Should pass the pattern matches to the data function.', function(done) {
      windex.stub(/(test)/, function(uri, test) {
        return { uri: uri, test: test };
      });
      windex.request('GET test').then(function(r) {
        assert(r.uri === 'test');
        assert(r.test === 'test');
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
        assert(r.status === true);
        assert(r.message === success);
        done();
      });
    });

    it('Should pass the POST data to the stub handler. (false positive)', function(done) {
      var user = { email: 'beta1@test.com', password: 'beta' };
      windex.request(service, user).then(function(r) {
        assert(r.status === false);
        assert(r.message === fail + user.email);
        done();
      });
    });

    it('Should pass the POST data to the stub handler. (false positive)', function(done) {
      var user = { email: 'beta@test.com', password: 'beta1' };
      windex.request(service, user).then(function(r) {
        assert(r.status === false);
        assert(r.message === fail + user.email);
        done();
      });
    });
  });
}());
