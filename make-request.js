var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-request",
  ["nrtv-browser-bridge", "request"],
  function(bridge, request) {

    function makeRequest() {
      var options = parseArgs(arguments)

      var params = {
        method: options.method,
        url: options.path
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

    //←
    makeRequest.defineInBrowser =
      function() {
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
          options.path = arg
        } else if (typeof arg == "function") {
          options.callback = arg
        }
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

