var assert = require('assert')
var http = require('http')
var serve = require('dwebfs-http')
var debug = require('debug')('dweb-node')

module.exports = function (archive, opts) {
  assert.ok(archive, 'lib/serve: archive required')
  opts = Object.assign({
    port: 8080,
    live: true,
    footer: 'Served via DWeb.'
  }, opts)

  var server = http.createServer(serve(archive, opts))
  server.listen(opts.port)
  server.on('listening', function () {
    debug(`http serving on PORT:${opts.port}`)
  })

  return server
}
