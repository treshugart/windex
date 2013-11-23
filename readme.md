Windex
======

Windex is a small AJAX library who's primary purpose is to make maintaining and calling AJAX requests not only easier, but more maintainable and testable.

Requirements
------------

- Q `0.9+` - Used for the Promise implementation.
- `JSON.parse()` - Used to parse response bodies that specify a `Content-Type` of `application/json`.
- `JSON.stringify()` - Used to serialize request bodies if a `Content-Type` request header of `application/json` is found.

Overview
--------

Windex gives you the means to generate functions that call an endpoint and return a promise representing the response. This allows you to organise functionality into an object, or repository.

    var http = Windex();
    var repo = {
      createUser: http.url('POST users').later(),
      readUser: http.url('GET users/:id').later(),
      updateUser: http.url('PATCH users/:id').later(),
      deleteUser: http.url('DELETE users/:id').later()
    };

In doing this, you have just made maintaining the endpoint URLs easier and have also made your code more self-documenting. You can use these new functions just as you would normally with the added bonus of promises.

    repo.createUser({ name: 'Bob Bobberson' }).then(function(r) {
      // do something
    });

If you look back a the function definitions, you'll notice the usage of the `:id` placeholder. If you specify any arguments that match a placeholder, it will be replaced with that argument's value.

You canj also use `Q` to fulfill each promise then execute a single callback when they are done. For more information see [Q's documentation](https://github.com/kriskowal/q).

    Q.all([
      repo.createUser({ id: 1, name: 'Bob Bobberson' }),
      repo.updateUser({ id: 1, name: 'Marge Margaretson' }),
      repo.readUser({ id: 1 }),
      repo.deleteUser({ id: 1 })
    ]).then(function(r) {
      // Marge Margaretson
      console.log(r[2].name);
    });

Configuration
-------------

Windex supports multiple configuration options that modify its behaviour. Thes are passed in to the constructor and are exposed through the `opts` property on an instance.

### cache

If set to `false` a parameter is added to the query string to break cache. If `true`, nothing is added.

### prefix

The prefix to add to the URL of every request. Defaults to `'/'`. Does not affect stubs.

### suffix

The suffix to add to the URL of every request. Defaults to an empty string. Does not affect stubs.

### headers

A hash of headers that will be sent with every request. By default the `Accept` header is set to `application/json`.

### parsers

A hash of parsers used to parse negotiated content types. A response `Content-Type` of `application/json` is supported by default. If a parser is not found for a particular response type, the response text is passed through.

### serializers

A hash of seralizers used to serialize the request body. By default a `Content-Type` of `application/json` is supported using `JSON.stringify()`. If no serializer is found for the content type specified in the request, the data is serialized using standard form serialization.

URLs
----
All URLs passed to any function in Windex are unformatted. This means the URL should be without the `prefix` and `suffix` as those will be applied automatically.

You can build your own RESTful URLs programatically:

    var w = Windex();

    // GET blog/:blog
    w.url().one('blog');

    // GET blog/:blog/comments
    w.url().one('blog').all('comments');

    // GET blog/:blog/comments/:limit/:page
    w.url().one('blog').many('comments');

    // POST blog/:blog/comments
    w.url().add.one('blog').all('comments');

    // PATCH blog/:blog/comments/:comment
    w.url().update.one('blog').one('comment');

    // PUT blog/:blog/comments/:comment
    w.url().replace.one('blog').one('comment');

    // DELETE blog/:blog/comments/:comment
    w.url().delete.one('blog').one('comment');

Once you have your URL, you can call it by calling `now()`.

    // GET /blogs
    // { blogs: [ ... ] }
    w.url().all('blogs').now();

    // GET /blog/1
    // { blog: { ... } }
    w.url().one('blog').now({ blog: 1 });

Even more useful as we've seen at the beginning was the use of `later()`.

    var later = w.url().one('blog').later();

    // GET /blog/1
    later({ blog: 1 });

Requests
--------

For handling adhoc requests, there is a suite of methods that may help you:

    var w = Windex();

    // URL should not include the request method.
    // i.e. my/resource
    w.get(url, data);
    w.post(url, data);
    w.put(url, data);
    w.delete(url, data);
    w.patch(url, data);
    w.options(url, data);
    w.head(url, data);
    w.trace(url, data);
    w.connect(url, data);

You can also call the main `request()` method which all of the above use.

    // URL should include the request method.
    // i.e. GET my/resource
    w.request(url, data);

### Content Negotiation

You can negotiate a request once it has executed by passing it to the `negotiate()` method:

    w.negotiate(xmlhHttpRequest);

### Data Serialization

Serialization of the `data` parameter is also available to you. This will format the data according to the `Content-Type` header you have specified in the list of headers in your options.

    w.serialize(data);

You can also access the factory used to create the `XMLHttpRequest`.

    // Will give you the correct XMLHttpRequest instance for your platform.
    w.xhr();

Testing
-------

A very useful feature of Windex is the ability to stub requests and responses without taking over all XMLHttpRequest instances. This means you can selectively stub out API calls without breaking any other functionality.

  w.stub('GET my/resource', {
    data: true
  });

  w.get('my/resource').then(function(r) {
    // true
    console.log(r.data);
  });

Things to note:

* Stubs are applied to instances. This means stubs against one instance don't affect stubs applied to another Windex instance.
* Stubs are NOT affected by the `prefix` and `suffix` options. This allows you to change that to whatever you need without affecting the URLs in your stubs.
