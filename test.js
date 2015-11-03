var test = require("nrtv-test")(require)

test.using(
  "posting data",

  ["./ajax", "nrtv-browse", "nrtv-server", "nrtv-element", "nrtv-browser-bridge"],
  function(expect, done, ajax, browse, Server, element, bridge) {

    var server = new Server()

    var writeResponse = bridge.defineFunction(
        function(response) {
          document.write(response.some)
        }
      )

    var button = element("button", {
      onclick: ajax
        .definePostInBrowser()
        .withArgs(
          "/stuffs",
          writeResponse,
          {some: "stuff"}
        ).evalable()
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