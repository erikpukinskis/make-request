var library = require("module-library")(require)

module.exports = library.export(
  "make-request",
  ["global-wait"],
  function generator(wait) {

    // Client side

    function makeRequestFromBrowser() {
      var options = parseArgs(arguments)

      if (!options.path) {
        throw new Error("makeRequest needs a path or a URL to hit! Pass it as a string argument, or add a path attribute to your options. You passed "+JSON.stringify(Array.prototype.slice.call(arguments, 2)))
      }

      var callback = options.callback

      if (options.data) {
        var data = JSON.stringify(
          options.data)

      } else if (options.formData) {
        var data = stringifyQuery(
          options.formData)
      }

      // Code originally from https://gist.github.com/Xeoncross/7663273

      // But I've modified it a lot

      var ticket = wait.start(options.method.toUpperCase()+" "+options.fullPath)

      try {
        var X = window.XMLHttpRequest || ActiveXObject

        var x = new X("MSXML2.XMLHTTP.3.0")

        x.open(
          options.method,
          options.fullPath,
          1)


        // Custom HTTP headersr
        if (options.headers) {
          for(var key in options.headers) {
            x.setRequestHeader(
              key,
              options.headers[key])
          }
        }


        // HTTP basic auth

        if (options.auth) {
          throw new Error("options.auth in the browser is untested. Delete this line of code and make a pull request and I'll test it. -Erik")

        } else if (options.auth) {

          if (!options.auth.user || !options.auth.password) {
            throw new Error(
              "The \"auth\": option for makeRequest needs an object with a \"user\" key and a \"password\" key")}

          var login = options.auth.user+":"+options.auth.password

          var payload = btoa(login)

          x.setRequestHeader(
            "Authorization",
            "Basic "+payload)
        }

        x.setRequestHeader(
          'X-Requested-With',
          'XMLHttpRequest')
        x.setRequestHeader(
          'Content-type',
          'application/json')

        x.onreadystatechange = handleResponseInBrowser.bind(x, options.method, ticket)

        x.send(data)

      } catch (e) {
        window.console && console.log(e)}

    function stringifyQuery(params){
      var keyValues = Object.keys(params).map(
        function(key) {
          key = encodeURIComponent(
            key)
          value = encodeURIComponent(
            params[key])
          return key+"="+value})
      return keyValues.join(
        "&")}

      function handleResponseInBrowser(method, ticket, response) {

        var isComplete = this.readyState > 3 

        if (!isComplete) { return }

        if (typeof this.responseText == "undefined") {
          throw new Error("No response from request "+JSON.stringify(options))
        } else if (this.status >= 400) {
          throw new Error(this.responseText)
        }

        wait.finish(ticket)

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
      }
    }


    // Server side

    function makeRequestOnServer() {
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

      if (options.timeout) {
        params.timeout = options.timeout
      }

      if (options.method == "POST") {

        var contentType = options.contentType || "application/json"
        params.headers = {"content-type": contentType}
        params.json = true

        if (options.body) {
          params.body = options.body

        } else if (options.data) {
          params.body = options.data

        } else if (options.formData) {
          params.form = options.formData
        }

      }

      function logIt(extras) {
        log("MAKE REQUEST * "+options.method, "→", params.url, JSON.stringify(params, null, 2))
      }

      // Custom HTTP headers

      if (options.headers) {
        for(var key in options.headers) {
          var value = options.headers[key]
          if (!params.headers) {
            params.headers = {}}
          params.headers[key] = value
        }
      }


      // HTTP Basic Auth

      if (options.auth) {
        if (!options.auth.user || !options.auth.password) {
          throw new Error("The \"auth\": option for makeRequest needs an object with a \"user\" key and a \"password\" key")}

        if (!params.headers) {
          params.headers = {}}
        var payload = "Basic "+Buffer.from(options.auth.user+":"+options.auth.password).toString("base64")
        params.headers["Authorization"] = payload
      }


      var request = require("request")
      var http = require("http")

      logIt(params.body)

      request(
        params,
        handleResponseOnServer)

      function handleResponseOnServer(error, response) {
        if (error && error.code) {
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
          response.statusCode && log(response.statusCode.toString(), require("http").STATUS_CODES[response.statusCode], "←", options.method, params.url)
        }

        var content = response && response.body

        options.callback && options.callback(content, response, error)
      }
    }

    function stringifyQuery(params){
      var keyValues = Object.keys(params).map(
        function(key) {
          key = encodeURIComponent(
            key)
          value = encodeURIComponent(
            params[key])
          return key+"="+value})
      return keyValues.join(
        "&")}

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

    var onServer = typeof window == "undefined"

    if (onServer) {
      var makeRequest = makeRequestOnServer
    } else {
      var makeRequest = makeRequestFromBrowser
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

      var binding = bridge.remember("make-request")

      if (binding) { return binding }

      var waitInBrowser = wait.defineOn(bridge)

      var binding = bridge.defineSingleton([
        waitInBrowser],
        generator)

      bridge.see("make-request", binding)

      return binding
    }



    // This used to be a whole separat module once:!

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

      return options
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

    return makeRequest
  }
)
