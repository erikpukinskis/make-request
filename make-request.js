var library = require("nrtv-library")(require)

module.exports = library.export(
  "make-request",
  ["request", "http", "nrtv-wait"],
  function(request, http, wait) {

    function makeRequest() {
      var options = parseArgs(arguments)

      var url = options.url

      if (!url) {
        var port = options.port.call ? options.port() : options.port
        url = "http://localhost:"+port+options.fullPath
      }

      var params = {
        method: options.method,
        url: url
      }

      var beQuiet = params.url.match(/favicon.ico$/)

      function log() {
        if (!beQuiet) {
          console.log.apply(null, arguments)
        }
      }

      if (options.method == "POST") {

        var contentType = options.contentType || "application/json"
        params.headers = {"content-type": contentType}
        params.json = true
        params.body = options.body || options.data

        log(options.method, "→",params.url, printable(params.body)
        )
      } else {
        log(options.method, "→", params.url)
      }

      request(
        params,
        function(error, response) {

          if (error) {
            switch(error.code) {
              case 'ENOTFOUND':
                var message = "Address not found. is your internet connection working?"
                break

              case 'ECONNREFUSED':
                var message = "Connection refused"
                break

              default:
                var message = error.message
                break
            }
            log(message, "←", options.method, params.url)
          } else {
            log(response.statusCode.toString(), http.STATUS_CODES[response.statusCode], "←", options.method, params.url)
          }

          var content = response && response.body

          options.callback && options.callback(content, response, error)
        }
      )
    }

    function printable(object) {

      if (typeof object == "string") {
        return object
      }

      if (!object) { return "[empty]" }

      var keys = Object.keys(object)

      var str = "{\n"

      str += keys.map(function(key) {
        var entry = "  \""+key+"\": "+JSON.stringify(object[key])
        if (entry.length > 61) {
          entry = entry.slice(0,60)+"...\""
        }
        return entry
      }).join(",\n")

      str += "\n}"

      return str
    }

    makeRequest.with = function(options) {
      var make = makeRequest.bind(null, options)

      make.defineOn = defineOnBridgeWithOptions.bind(null, options)

      return make
    }

    function defineOnBridgeWithOptions(options, bridge) {
      return makeRequest.defineOn(bridge).withArgs(options)
    }

    makeRequest.defineOn = function(bridge) {

      var parseInBrowser = bridge.defineFunction(parseArgs)

      var waitInBrowser = wait.defineOn(bridge)

      return bridge.defineFunction([parseInBrowser, waitInBrowser], makeXmlHttpRequest)
    }

    function parseArgs(args) {
      var options = {
        method: "GET"
      }

      for (var i=0; i<args.length; i++) {

        var arg = args[i]
        var isFunction = typeof arg == "function"

        if (typeof arg == "object") {
          extend(options, arg)
        } else if (typeof arg == "string") {
          if (isUrl(arg)) {
            options.url = arg
          } else {
            options.path = arg
          }
        } else if (isFunction && !options.callback) {
          options.callback = arg
        } else if (isFunction) {
          options.errorCallback = arg
        }
      }

      options.method = options.method.toUpperCase()

      options.fullPath = "/"

      if (options.prefix) {
        options.fullPath += strip(options.prefix)+"/"
      }

      if (options.path) {
        options.fullPath += strip(options.path)
      }

      function strip(string) {
        var begin = 0
        var length = string.length
        if (string[begin] == "/") {
          begin++
        }
        if(string[length-1] == "/") {
          length--
        }
        return string.substr(begin, length)
      }

      function isUrl(string) {
        return string.match(/https?\:\/\//)
      }

      function extend(fresh, object) {
        for(var key in object) {
          fresh[key] = object[key]
        }
        return fresh
      }

      return options
    }

    function makeXmlHttpRequest(parseArgs, wait) {
  
      var args = Array.prototype.slice.call(arguments, 2)

      var options = parseArgs(args)

      if (!options.path) {
        throw new Error("makeRequest needs a path or a URL to hit! Pass it as a string argument, or add a path attribute to your options. You passed "+JSON.stringify(Array.prototype.slice.call(arguments, 2)))
      }

      var data = options.data
      var callback = options.callback

      if (typeof data == "object") {
        data = JSON.stringify(data)
      }

      // Code from https://gist.github.com/Xeoncross/7663273

      var ticket = wait("start")

      try {
        var x = new(window.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
        x.open(options.method, options.fullPath, 1);
        x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        x.setRequestHeader('Content-type', 'application/json');
        x.onreadystatechange = handleResponse.bind(x, options.method, ticket)

        x.send(data)

      } catch (e) {
        window.console && console.log(e);
      }

      function handleResponse(method, ticket, response) {

        var isComplete = this.readyState > 3 

        if (!isComplete) { return }

        if (typeof this.responseText == "undefined") {
          throw new Error("No response from request "+JSON.stringify(options))
        } else if (this.status >= 400) {
          throw new Error(this.responseText)
        }

        if (method == "POST") {
          try {
            var object = JSON.parse(this.responseText)
          } catch(e) {
            throw new Error("Couldn't parse response \""+this.responseText+"\" from "+options.fullPath+". Make sure your server is returning valid JSON.")
          }

          callback && callback(object)
        } else {
          callback && callback(this.responseText)
        }

        wait("done", ticket)
      }

    }

    return makeRequest
  }
)

