var library = require("nrtv-library")(require)

library.test(
  "posting data",

  ["./ajax", "nrtv-browse", "nrtv-server", "nrtv-element", "nrtv-browser-bridge"],
  function(expect, done, ajax, browse, Server, element, BrowserBridge) {

    var server = new Server()

    console.log("ajax is", ajax)

    var done = BrowserBridge.defineOnClient(
        function(response) {
          document.write(response.some)
        }
      )

    var button = element("button", {
      onclick: ajax.withArgs(
        "/endpoint",
        done,
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
            expect(request.body.some).to.equal(stuff)
            response.json({some: "garbage"})
            browser.assert.text("body", "garbage")
            done()
          }
        )

        browser.pressButton("button")
      }
    )
  }
)