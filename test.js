var test = require("nrtv-test")(require)

// test.only("posting from server to server")

test.using(
  "posting data from the browser",

  ["./", "nrtv-browse", "nrtv-server", "nrtv-element", "nrtv-browser-bridge"],
  function(expect, done, makeRequest, browse, Server, element, bridge) {

    var server = new Server()

    var writeResponse = bridge.defineFunction(
        function(response) {
          document.write(response.some)
        }
      )

    var getStuff = makeRequest
      .defineInBrowser()
      .withArgs({
        method: "post",
        path: "/stuffs",
        data: {some: "stuff"}
      }, writeResponse)

    var button = element("button", {
      onclick: getStuff.evalable()
    })

    server.get(
      "/",
      bridge.sendPage(button)
    )

    server.post(
      "/stuffs",
      function(request, response) {
        expect(request.body).to.have.property("some", "stuff")

        response.json({some: "garbage"})
      }
    )

    server.start(5050)
    
    browse("http://localhost:5050",
      function(browser) {
        browser.pressButton("button",runChecks)

        function runChecks() {
          browser.assert.text("body", "garbage")

          server.stop()
          done()
        }
      }
    )
  }
)



test.using(
  "getting text from the browser",

  ["./", "nrtv-browse", "nrtv-server", "nrtv-element", "nrtv-browser-bridge"],
  function(expect, done, makeRequest, browse, Server, element, bridge) {

    var server = new Server()

    bridge.asap(
      bridge.defineFunction(
        [makeRequest.defineInBrowser()],
        function(makeRequest) {
          makeRequest("/bird", function(bird) {
            document.write(bird)
          })
        }
      )
    )

    server.get(
      "/",
      bridge.sendPage()
    )

    server.get(
      "/bird",
      function(request, response) {
        response.send("big bird")
      }
    )

    server.start(9090)

    browse("http://localhost:9090",
      function(browser) {
        browser.assert.text("body", "big bird")

        server.stop()
        done()
      }
    )

  }
)



test.using(
  "posting from server to server",
  ["./", "nrtv-server"],
  function(expect, done, makeRequest, Server) {

    var server = new Server()
    server.post("/test",
      function(request, response) {
        console.log("fu", request.body)
        response.send("dirt "+request.body.dirt+" is free of heavy metals!")
      }
    )

    setTimeout(function() {
    server.start(12118)


    makeRequest(
      "http://localhost:12118/test",
      {
        method: "post",
        data: {
          dirt: "from by the shed"
        }
      },
      function(text) {
        expect(text).to.equal("dirt from by the shed is free of heavy metals!")
        server.stop()
        done()
      }
    )
  },50) // Getting socket hang up error at zombie/lib/pipeline.js:89 without this when we run this together with other tests
  }
)

test.using(
  "pre-binding options",
  ["./", "nrtv-server"],
  function(expect, done, makeRequest, Server) {

    var server = new Server()
    server.get("/some-prefix/foo",
      function(request, response) {
        response.send("oka!")
      }
    )

    server.start(4447)

    var request = makeRequest.bind(
      null, {
        prefix: "/some-prefix",
        port: 4447
      }
    )

    setTimeout(function() {
    request("/foo",
      function(text) {
        expect(text).to.equal("oka!")
        server.stop()
        done()
      }
    )
    }, 50) // Getting socket hang up error at zombie/lib/pipeline.js:89 without this when we run this together with other tests
  }
)
