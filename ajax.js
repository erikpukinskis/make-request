var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-ajax",
  ["nrtv-browser-bridge"],
  function(BrowserBridge) {

    function ajax(url, callback, data, x) {

      if (data && typeof data != "object") {
        throw new Error("The third thing you passed to ajax ("+JSON.stringify(data)+") doesn't look like an object. If you want to post data, give us an object.")
      }

      data = JSON.stringify(data)

      // Code from https://gist.github.com/Xeoncross/7663273
      
      try {
        x = new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
        x.open(data ? 'POST' : 'GET', url, 1);
        x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        x.setRequestHeader('Content-type', 'application/json');
        x.onreadystatechange = function () {
          x.readyState > 3 && callback && callback(JSON.parse(x.responseText), x);
        };
        x.send(data)
      } catch (e) {
        window.console && console.log(e);
      }
    }

    var binding = BrowserBridge.defineOnClient(ajax)

    return binding
  }
)
