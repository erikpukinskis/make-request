module.exports = 
  function makeRequest(parseArgs, wait) {

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

    var ticket = wait.start(options.method.toUpperCase()+" "+options.fullPath)

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
