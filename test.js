var runTest = require("run-test")(require)

runTest(
  "posting from site to site",
  ["./", "web-site"],
  function(expect, done, makeRequest, WebSite) {

    var site = new WebSite()
    site.addRoute(
      "post",
      "/test",
      function(request, response) {
        response.send("dirt "+request.body.dirt+" is free of heavy metals!")
      }
    )

    site.start(12118)

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
        site.stop()
        done()
      }
    )
  }
)

runTest(
  "specify content type",
  ["./", "web-site"],
  function(expect, done, makeRequest, WebSite) {

    var site = new WebSite()
    site.addRoute(
      "post",
      "/test",
      function(request, response) {

        expect(request.header("content-type")).to.equal("application/x-www-form-urlencoded")

        // WebSite isn't handling bodies well enough to test this yet:

        // expect(request.body).to.equal("hi=ho")

        response.send("ok")

        site.stop()
        done()
      }
    )

    site.start(6475)

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


runTest(
  "pre-binding options functions",
  ["./", "web-site"],
  function(expect, done, makeRequest, WebSite) {

    var site = new WebSite()
    site.addRoute(
      "get",
      "/some-prefix/foo",
      function(request, response) {
        response.send("oka!")
      }
    )

    site.start(4447)

    var request = makeRequest.bind(
      null, {
        prefix: "/some-prefix",
        port: function() {return 4447}
      }
    )

    request("/foo",
      function(text) {
        expect(text).to.equal("oka!")
        site.stop()
        done()
      }
    )
  }
)


runTest(
  "handling errors",

  ["./", "web-site"],
  function(expect, done, makeRequest, WebSite) {

    var site = new WebSite()

    site.addRoute("get", "/",
      function(request, response) {
        response.sendStatus(400)
      }
    )

    site.addRoute("get", "/ok",
      function(request, response) {
        response.send("ok!")
      }
    )

    site.start(5043)

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
          site.stop()
          done()
        }
      )
    }

  }
)

runTest.failAfter(100000000)


runTest(
  "getting text from the browser",

  ["./", "browser-task", "web-site", "web-element", "browser-bridge"],
  function(expect, done, makeRequest, browserTask, WebSite, element, bridge) {

    var site = new WebSite()

    bridge.asap(
      [makeRequest.defineOn(bridge)],
      function(makeRequest) {
        makeRequest("/bird", function(kindOfBird) {
          makeRequest("/finish/"+kindOfBird)
        })
      }
    )

    site.addRoute("get", "/",
      bridge.requestHandler()
    )

    site.addRoute("get", "/bird",
      function(request, response) {
        response.send("big bird")
      }
    )

    site.addRoute(
      "get",
      "/finish/:bird",
      function(request, response) {
        expect(request.params.bird).to.equal("big bird")
        response.send("ok!")
        heardBack = true
        finishUp()
      }
    )

    site.start(9090)

    var heardBack = false

    var browser = browserTask("http://localhost:9090", finishUp)

    function finishUp() {
      if (!heardBack || !browser.ready) { return }
      browser.done()
      site.stop()
      done()
    }
  }
)

