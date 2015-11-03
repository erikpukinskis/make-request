var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-request",
  ["nrtv-browser-bridge", "request"],
  function(bridge, request) {

    function makeRequest() {
      var options = parseArgs(arguments)

      var url = options.url
      if (!options.url) {
        url = "http://localhost:"+options.port
        if (options.prefix) {
          url = url+"/"+strip(options.prefix)
        }
        if (options.path) {
          url = url+"/"+strip(options.path)
        }
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

      console.log(options, "url is", url)
      var params = {
        method: options.method,
        url: url
      }

      if (options.method == "POST") {
        params.headers = {"content-type": "application/json"}
        params.json = true
        params.body = options.data

        console.log(
          options.method,
          "→",
          params.url,
          JSON.stringify(
            options.data
          )
        )
      }

      request(
        params,
        function(error, response) {
          if (error) {
            throw error
          }
          options.callback(response.body)
        }
      )
    }

    makeRequest.defineInBrowser = defineInBrowser

    makeRequest.with = function(options) {
      var make = makeRequest.bind(null, options)
      make.defineInBrowser =
        function(options) {
          return defineInBrowser().withArgs(options)
        }
      return make
    }

    function defineInBrowser() {
      return bridge.defineFunction([parseArgs.defineInBrowser()], makeXmlHttpRequest)
    }

    function parseArgs(args) {
      var options = {
        method: "GET"
      }

      for (var i=0; i<args.length; i++) {

        var arg = args[i]

        if (typeof arg == "object") {
          extend(options, arg)
        } else if (typeof arg == "string") {
          if (isUrl(arg)) {
            options.url = arg
          } else {
            options.path = arg
          }
        } else if (typeof arg == "function") {
          options.callback = arg
        }
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

      options.method = options.method.toUpperCase()

      return options
    }

    parseArgs.defineInBrowser = 
      function() {
        return bridge.defineFunction(parseArgs)
      }

    function makeXmlHttpRequest(parseArgs) {
      var options = parseArgs(
        Array.prototype.slice.call(
          arguments, 1
        )
      )

      var data = options.data

      if (typeof data == "object") {
        data = JSON.stringify(data)
      }

      // Code from https://gist.github.com/Xeoncross/7663273

      try {
        var x = new(window.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
        x.open(options.method, options.path, 1);
        x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        x.setRequestHeader('Content-type', 'application/json');
        x.onreadystatechange = handleResponse.bind(x, options.method)

        x.send(data)

      } catch (e) {
        window.console && console.log(e);
      }

      function handleResponse(method) {

        var isComplete = this.readyState > 3 

        if (isComplete && method == "POST") {
          options.callback(JSON.parse(this.responseText))
        } else if (isComplete) {
          options.callback(this.responseText)
        }
      }

    }

    return makeRequest
  }
)

