Make HTTP requests through a standard interface on both the client and the server:

  var makeRequest = require("nrtv-make-request")

  makeRequest({
    method: "get",
    url: "http://google.com"
  }, function(html) {
    console.log(html)
  })

Do the same thing in the browser, with browser bridge support:

  var bridge = new require("nrtv-browser-bridge")

  var makeSpaghetti = bridge.defineFunction(
    [makeRequest.defineInBrowser()],
    function(makeRequest) {
      makeRequest({
        method: "post",
        path: "/spaghetti",
        data: {servings: 3},
      }, function(yum) {
        alert(yum)
      })
    }
  )

  bridge.asap(makeSpaghetti)

  var app = require("express")()

  app.get("/", bridge.sendPage())

You can also pre-set options which will apply in both the browser and the server:

  var element = require("nrtv-element")

  var kidFriendly = makeRequest.with({prefix: "/kids"})

  var kidButton = element("button", {
    onclick: kidFriendly.defineInBrowser()
  })
