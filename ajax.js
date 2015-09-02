var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-ajax",
  ["nrtv-browser-bridge"],
  function(BrowserBridge) {

    // From http://www.quirksmode.org/js/xmlhttp.html

    var factories = BrowserBridge.defineOnClient(
      function XMLHttpFactories() {
        return [
          function () {return new XMLHttpRequest()},
          function () {return new ActiveXObject("Msxml2.XMLHTTP")},
          function () {return new ActiveXObject("Msxml3.XMLHTTP")},
          function () {return new ActiveXObject("Microsoft.XMLHTTP")}
        ]
      }
    )

    var create = BrowserBridge.defineOnClient(
      [factories],
      function createXMLHTTPObject(XMLHttpFactories) {
        var xmlhttp = false;
        for (var i=0;i<XMLHttpFactories().length;i++) {
          try {
            xmlhttp = XMLHttpFactories()[i]();
          }
          catch (e) {
            continue;
          }
          break;
        }
        return xmlhttp;
      }
    )


    var ajax = BrowserBridge.defineOnClient(
      [create],
      function sendRequest(createXMLHTTPObject, url,callback, postData) {
        var req = createXMLHTTPObject();
        if (!req) return;
        var method = (postData) ? "POST" : "GET";
        req.open(method,url,true);
        if (postData)
          req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
        req.onreadystatechange = function () {
          if (req.readyState != 4) return;
          if (req.status != 200 && req.status != 304) {
      //      alert('HTTP error ' + req.status);
            return;
          }
          callback(req);
        }
        if (req.readyState == 4) return;
        req.send(postData);
      }
    )

    console.log("ajax here is", ajax)
    return ajax
  }
)
