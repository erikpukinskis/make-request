var library = require("nrtv-library")(require)

library.test(
  "posting data",

  ["./ajax", "nrtv-browse", "nrtv-server", "nrtv-element", "nrtv-browser-bridge"],
  function(expect, done, ajax, browse, Server, element, BrowserBridge) {

    var server = new Server()

    var writeResponse = BrowserBridge.defineOnClient(
        function(response) {
          debugger
          document.write(response.some)
        }
      )

    var button = element("button", {
      onclick: ajax.withArgs(
        "/endpoint",
        writeResponse,
        {some: "stuff"}
      ).evalable()
    })

    server.get(
      "/",
      BrowserBridge.sendPage(button)
    )

    server.start(5050)
    
    browse("http://localhost:5050",
      function(browser) {

        server.post(
          "/endpoint",
          function(request, response) {

            expect(request.body).to.have.property("some", "stuff")

            response.json({some: "garbage"})
          }
        )

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