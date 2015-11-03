var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-request",
  ["nrtv-browser-bridge"],
  function(bridge) {

    function makeRequest() {
    }


    makeRequest.defineInBrowser =
      function() {
        return bridge.defineFunction(
          makeXmlHttpRequest
        )
      }

    function makeXmlHttpRequest() {
      var options = {
        method: "GET"
      }
      var callback

      for (var i=0; i<arguments.length; i++) {

        var arg = arguments[i]

        if (typeof arg == "object") {
          extend(options, arg)
        } else if (typeof arg == "string") {
          options.path = arg
        } else if (typeof arg == "function") {
          callback = arg
        }
      }

      options.method = options.method.toUpperCase()

      // Code from https://gist.github.com/Xeoncross/7663273

      var x = new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
      x.open(options.method, options.path, 1);
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      x.setRequestHeader('Content-type', 'application/json');
      x.onreadystatechange = handleResponse.bind(x, options.method)

      function handleResponse(method) {

        var isComplete = this.readyState > 3 

        if (isComplete && method == "POST") {
          callback(JSON.parse(this.responseText))
        } else if (isComplete) {
          callback(this.responseText)
        }
      }

      var data = options.data

      if (typeof data == "object") {
        data = JSON.stringify(data)
      }

      x.send(data)

      function extend(fresh, object) {
        for(var key in object) {
          fresh[key] = object[key]
        }
        return fresh
      }
    }

    return makeRequest
  }
)


function post(buildRequest, url, callback, data) {

  data = JSON.stringify(data)

  var request = buildRequest(
    "post", url,
    function(response) {
      callback(JSON.parse(response.responseText))
    }
  )

  request.send(data)
}


