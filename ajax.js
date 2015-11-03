var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-ajax",
  ["nrtv-browser-bridge"],
  function(bridge) {

    function request() {
      return bridge.defineFunction(buildRequest)
    }

    return {
      definePostInBrowser:
        function() {
          return bridge.defineFunction(
            [request()], post)
        }
    }

  }
)


function post(buildRequest, url, callback, data) {

  if (typeof data != "object") {
    throw new Error("The third thing you passed to post ("+JSON.stringify(data)+") doesn't look like an object. If you want to post data, give us an object.")
  }

  data = JSON.stringify(data)

  var request = buildRequest("post", url, callback)

  request.send(data)
}


function buildRequest(method, url, callback) {

  // Code from https://gist.github.com/Xeoncross/7663273

  try {
    var x = new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
    x.open(method, url, 1);
    x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    x.setRequestHeader('Content-type', 'application/json');
    x.onreadystatechange = function () {
      x.readyState > 3 && callback && callback(JSON.parse(x.responseText), x);
    };
    return x
  } catch (e) {
    window.console && console.log(e);
  }
}