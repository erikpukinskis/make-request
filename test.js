var test = require("nrtv-test")(require)

test.using(
  "posting data",

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

        browser.pressButton("button", function() {
            browser.assert.text("body", "garbage")

            server.stop()

            done()
          }
        )

      }
    )
  }
)



test.using(
  "getting text",

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