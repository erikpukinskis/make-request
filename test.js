var test = require("nrtv-test")(require)

// test.only("getting text from the browser")

test.using(
  "posting from server to server",
  ["./", "nrtv-server"],
  function(expect, done, makeRequest, Server) {

    var server = new Server()
    server.addRoute(
      "post",
      "/test",
      function(request, response) {
        response.send("dirt "+request.body.dirt+" is free of heavy metals!")
      }
    )

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
  }
)

test.using(
  "specify content type",
  ["./", "nrtv-server"],
  function(expect, done, makeRequest, Server) {

    var server = new Server()
    server.addRoute(
      "post",
      "/test",
      function(request, response) {

        expect(request.header("content-type")).to.equal("application/x-www-form-urlencoded")

        // Server isn't handling bodies well enough to test this yet:

        // expect(request.body).to.equal("hi=ho")

        response.send("ok")

        server.stop()
        done()
      }
    )

    server.start(6475)

    var runChecks

    makeRequest(
      "http://localhost:6475/test",
      {
        method: "post",
        contentType: "application/x-www-form-urlencoded",
        body: "hi=ho"
      }
    )

  }
)


test.using(
  "pre-binding options functions",
  ["./", "nrtv-server"],
  function(expect, done, makeRequest, Server) {

    var server = new Server()
    server.addRoute(
      "get",
      "/some-prefix/foo",
      function(request, response) {
        response.send("oka!")
      }
    )

    server.start(4447)

    var request = makeRequest.bind(
      null, {
        prefix: "/some-prefix",
        port: function() {return 4447}
      }
    )

    request("/foo",
      function(text) {
        expect(text).to.equal("oka!")
        server.stop()
        done()
      }
    )
  }
)


test.using(
  "handling errors",

  ["./", "nrtv-server"],
  function(expect, done, makeRequest, Server) {

    var server = new Server()

    server.addRoute("get", "/",
      function(request, response) {
        response.sendStatus(400)
      }
    )

    server.addRoute("get", "/ok",
      function(request, response) {
        response.send("ok!")
      }
    )

    server.start(5043)

    makeRequest(
      "http://localhost:5043",
      function(body, response) {
        expect(response.statusCode).to.equal(400)
        done.ish("got error back")
        makeGoodRequest()
      }
    )

    function makeGoodRequest() {
      makeRequest(
        "http://localhost:5043/ok",
        function ok(body) {
          expect(body).to.equal("ok!")
          done.ish("successful request works")
          requestToNowhere()
        }
      )
    }

    function requestToNowhere() {
      makeRequest(
        "http://localhost:61536",
        function(body, response, error) {
          expect(body).to.be.undefined
          expect(response).to.be.undefined
          expect(error.code).to.equal("ECONNREFUSED")
          server.stop()
          done()
        }
      )
    }

  }
)


test.using(
  "getting text from the browser",

  ["./", "nrtv-browse", "nrtv-server", "nrtv-element", "browser-bridge"],
  function(expect, done, makeRequest, browse, Server, element, bridge) {

    var server = new Server()

    bridge.asap(
      bridge.defineFunction(
        [makeRequest.defineOn(bridge)],
        function(makeRequest) {
          makeRequest("/bird", function(bird) {
            makeRequest("/finish/"+bird)
          })
        }
      )
    )

    server.addRoute("get", "/",
      bridge.sendPage()
    )

    server.addRoute("get", "/bird",
      function(request, response) {
        response.send("big bird")
      }
    )

    server.addRoute(
      "get",
      "/finish/:bird",
      function(request, response) {
        expect(request.params.bird).to.equal("big bird")

        if (finishUp) { finishUp() }
        else { heardBack = true }
      }
    )

    server.start(9090)

    var finishUp
    var heardBack = false

    browse("http://localhost:9090",
      function(browser) {
        finishUp = function() {
          browser.done()
          server.stop()
          done()
        }
        if (heardBack) { finishUp() }
      }
    )

  }
)

