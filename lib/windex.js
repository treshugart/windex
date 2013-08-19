!function(factory) {
  if (typeof exports === 'object') {
    module.exports = factory(require('q'));
  } else if (typeof define === 'function' && define.amd) {
    define(['q'], factory);
  } else {
    Windex = factory(Q);
  }
}(function(Q) {
  function Windex() {
    this.cache = false;
    this.headers = {
      Accept: 'application/json'
    };
    this.parsers = {
      'application/json': function(data) {
        return JSON.parse(data || {});
      }
    };
    this.prefix = '/';
    this.suffix = '';
  }

  Windex.create = function() {
    return new Windex();
  };

  Windex.prototype = {
    get: function(url, data) {
      return this.request('GET ' + url, data);
    },

    post: function(url, data) {
      return this.request('POST ' + url, data);
    },

    put: function(url, data) {
      return this.request('PUT ' + url, data);
    },

    delete: function(url, data) {
      return this.request('DELETE ' + url, data);
    },

    patch: function(url, data) {
      return this.request('PATCH ' + url, data);
    },

    options: function(url, data) {
      return this.request('OPTIONS ' + url, data);
    },

    head: function(url, data) {
      return this.request('HEAD ' + url, data);
    },

    trace: function(url, data) {
      return this.request('TRACE ' + url, data);
    },

    connect: function(url, data) {
      return this.request('CONNECT ' + url, data);
    },

    request: function(url, data) {
      var that = this
        , type = url.split(' ')[0].toUpperCase()
        , url = this.prefix + url.split(' ')[1] + this.suffix
        , data = data || {}
        , request = this.xhr()
        , deferred = Q.defer();

      if (!this.cache) {
        data['_' + new Date().getTime()] = '1';
      }

      if (typeof data === 'object') {
        data = this.serialize(data);
      }

      if (data && type === 'GET') {
        url += '?' + data;
      }

      request.open(type, url, true);

      if (data && type !== 'GET') {
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }

      for (var header in this.headers) {
        request.setRequestHeader(header, this.headers[header]);
      }

      request.onreadystatechange = function() {
        if (request.readyState !== 4) {
          return;
        }

        if (request.status !== 200 && request.status !== 304) {
          throw new Error(request.status + ': ' + request.statusText);
        }

        deferred.resolve(that.negotiate(request));
      };

      if (type === 'GET') {
        request.send();
      } else {
        request.send(data);
      }

      return deferred.promise;
    },

    negotiate: function(request) {
      var contentType = request.getResponseHeader('Content-Type');

      if (contentType && typeof this.parsers[contentType] === 'function') {
        try {
          return this.parsers[contentType](request.responseText);
        } catch (e) {
          deferred.reject(new Error('Cannot parse the response "' + request.responseText + '" with the content type of "' + contentType + '" from "' + request.url + '" with message: ' + e));
        }
      }

      return request.responseText;
    },

    serialize: function(obj, prefix) {
      var str = [];

      for (var a in obj) {
        var k = prefix ? prefix + '[' + a + ']' : a
          , v = obj[a];

        str.push(typeof v === 'object' ? this.serialize(v, k) : encodeURIComponent(k) + '=' + encodeURIComponent(v));
      }

      return str.join('&');
    },

    proxy: function(url, defaults) {
      var that = this;

      return function(data) {
        var remove = []
          , formatted = url
          , data = data || {};

        // Merge in default parameters.
        for (var a in defaults) {
          if (typeof data[a] === 'undefined') {
            data[a] = defaults[a];
          }
        }

        // Replace placeholcers and mark fields for deletion.
        for (var b in data) {
          if (formatted.match(':' + b)) {
            formatted = formatted.replace(':' + b, data[b]);
            remove.push(b);
          }
        }

        // Remove fields that were replace from the original data hash.
        for (var c = 0; c < remove.length; c++) {
          delete data[remove[c]];
        }

        return that.request(formatted, data);
      };
    },

    xhr: function() {
      var request = false
        , factories = [
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
            function () { return new ActiveXObject('Msxml3.XMLHTTP'); },
            function () { return new ActiveXObject('Microsoft.XMLHTTP'); }
          ];

      for (var a = 0; a < factories.length; a++) {
        try {
          request = factories[a]();
        } catch (e) {
          continue;
        }
      }

      if (!request) {
        throw 'An XMLHttpRequest could not be generated.';
      }

      return request;
    }
  };

  return Windex;
});