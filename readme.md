Windex
======

Windex is a small JavaScript library that generates functions which make asynchronous HTTP calls and return promises. The purpose of slack is to provide a clean way to abstract API calls into a simple method call with parameters.

Requirements
------------

- Q `0.9` - Used for the Promise implementation.
- `JSON.parse()` - Used by default for JSON response parsing.

Overview
--------

The goal of Windex is to make maintaining calls to HTTP endpoints short, simple and maintainable. It gives you the flexibility of defining methods which abstract the HTTP call and parameterization while returning you a promise that is fulfilled or rejected when the call is finished.

    var http = Windex.create();
      , repo = {
          createUser: http.proxy('POST users'),
          readUser: http.proxy('GET users/:id'),
          updateUser: http.proxy('PATCH users/:id'),
          deleteUser: http.proxy('DELETE users/:id')
        };

You have just made maintaining the endpoint URLs easier and have also made your code more self-documenting. Use these new functions just as you would normally with the added bonus of promises.

    repo.createUser({ name: 'Bob Bobberson' }).then(function(r) {
      // do something
    });

If you look back a the function definitions, you'll notice the usage of the `:id` placeholder. If you specify any arguments that match a placeholder, it will be replaced with that argument's value.

    Q.all([
      repo.createUser({ id: 1, name: 'Bob Bobberson' }),
      repo.updateUser({ id: 1, name: 'Marge Margaretson' }),
      repo.readUser({ id: 1 }),
      repo.deleteUser({ id: 1 })
    ]).then(function() {
      // Marge Margaretson
      console.log(r[1].name);
    });

Configuration
-------------

Windex supports multiple configuration options that modify it's behaviour. These options are exposed as properties on a `Windex` instance.

* cache `false` If set to `false` a parameter is added to the query string to break cache. If `true, nothing is added.
* headers `{}` A hash of headers that will be sent with every request.
* parsers `{}` A hash of parsers used to parse negotiated content types.
* prefix `"/"` The prefix to add to the URL of every request.
* suffix `""` The suffix to add to the URL of every request.

Content Negotiation
-------------------

Windex automatically negotiates the content type of the response and attempts to parse it into the correct format. If negotiation is unsuccessful, the response is simply passed through.

By default, Windex sends an `Accept` header with the value of `application/json` and has a built-in parser for `application/json` that uses `JSON.parse()`. The `Content-Type` header in the response is used to tell Windex how the response should be parsed. Once the response is handled, the promise is fulfilled using that reponse.

Helper Methods
--------------

Aside from the main purpose of Windex - `proxy()` - there is also a suite of methods that you can call. There is a method for each method in the HTTP 1.1 Method Definition with the addition of `PATCH`.

    var w = Windex.create();

    // `url` is the URL sans the Request Method: my-url.json
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

    // `url` is the Request Method and URL: GET my-url.json
    w.request(url, data);

Serialization of the `data` parameter is also available to you. This will turn an object into a query string.

    w.serialize(data);

You can also access the factory used to create the `XMLHttpRequest`.

    // Will give you the correct XMLHttpRequest instance for your platform.
    w.xhr();
