var fs = require('fs')
var path = require('path')
var test = require('tape')
var rimraf = require('rimraf')
var tmpDir = require('temporary-directory')

var DWeb = require('..')
var fixtures = path.join(__dirname, 'fixtures')

test('misc: clean old test', function (t) {
  rimraf(path.join(fixtures, '.dweb'), function () {
    t.end()
  })
})

test('misc: empty dweb folder ok', function (t) {
  fs.mkdir(path.join(fixtures, '.dweb'), function () {
    DWeb(fixtures, function (err, dweb) {
      t.error(err, 'no error')
      rimraf.sync(path.join(fixtures, '.dweb'))
      t.end()
    })
  })
})

test('misc: existing invalid dweb folder', function (t) {
  fs.mkdir(path.join(fixtures, '.dweb'), function () {
    fs.writeFile(path.join(fixtures, '.dweb', '0101.db'), '', function () {
      DWeb(fixtures, function (err, dweb) {
        t.ok(err, 'errors')
        rimraf.sync(path.join(fixtures, '.dweb'))
        t.end()
      })
    })
  })
})

test('misc: non existing invalid dweb path', function (t) {
  t.throws(function () {
    DWeb('/non/existing/folder/', function () {})
  })
  t.end()
})

test('misc: open error', function (t) {
  t.skip('TODO: lock file')
  t.end()

  // DWeb(process.cwd(), function (err, datA) {
  //   t.error(err)
  //   DWeb(process.cwd(), function (err, datB) {
  //     t.ok(err, 'second open errors')
  //     datA.close(function () {
  //       rimraf(path.join(process.cwd(), '.dweb'), function () {
  //         t.end()
  //       })
  //     })
  //   })
  // })
})

test('misc: expose .key', function (t) {
  var key = Buffer.alloc(32)
  DWeb(process.cwd(), { key: key, temp: true }, function (err, dweb) {
    t.error(err, 'error')
    t.deepEqual(dweb.key, key)

    DWeb(fixtures, { temp: true }, function (err, dweb) {
      t.error(err, 'error')
      t.notDeepEqual(dweb.key, key)
      dweb.close(function (err) {
        t.error(err, 'error')
        t.end()
      })
    })
  })
})

test('misc: expose .writable', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'error')
    DWeb(fixtures, function (err, shareDat) {
      t.error(err, 'error')
      t.ok(shareDat.writable, 'is writable')
      shareDat.joinNetwork()

      DWeb(downDir, { key: shareDat.key }, function (err, downDat) {
        t.error(err, 'error')
        t.notOk(downDat.writable, 'not writable')

        shareDat.close(function (err) {
          t.error(err, 'error')
          downDat.close(function (err) {
            t.error(err, 'error')
            cleanup(function (err) {
              rimraf.sync(path.join(fixtures, '.dweb'))
              t.error(err, 'error')
              t.end()
            })
          })
        })
      })
    })
  })
})

test('misc: expose swarm.connected', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'error')
    var downDat
    DWeb(fixtures, { temp: true }, function (err, shareDat) {
      t.error(err, 'error')

      t.doesNotThrow(shareDat.leave, 'leave before join should be noop')

      var network = shareDat.joinNetwork()
      t.equal(network.connected, 0, '0 peers')

      network.once('connection', function () {
        t.ok(network.connected >= 1, '>=1 peer')
        shareDat.leave()
        t.skip(downDat.network.connected, 0, '0 peers') // TODO: Fix connection count
        downDat.close(function (err) {
          t.error(err, 'error')
          shareDat.close(function (err) {
            t.error(err, 'error')
            cleanup(function (err) {
              t.error(err, 'error')
              t.end()
            })
          })
        })
      })

      DWeb(downDir, { key: shareDat.key, temp: true }, function (err, dweb) {
        t.error(err, 'error')
        dweb.joinNetwork()
        downDat = dweb
      })
    })
  })
})

test('misc: close twice errors', function (t) {
  DWeb(fixtures, { temp: true }, function (err, dweb) {
    t.error(err, 'error')
    dweb.close(function (err) {
      t.error(err, 'error')
      dweb.close(function (err) {
        t.ok(err, 'has close error second time')
        t.end()
      })
    })
  })
})

test('misc: close twice sync errors', function (t) {
  DWeb(fixtures, { temp: true }, function (err, dweb) {
    t.error(err, 'error')
    dweb.close(function (err) {
      t.error(err, 'error')
      t.end()
    })
    dweb.close(function (err) {
      t.ok(err, 'has close error second time')
    })
  })
})

test('misc: create key and open with different key', function (t) {
  t.skip('TODO')
  t.end()
  // TODO: dwebfs needs to forward ddatabase metadta errors
  // https://github.com/distributedweb/dwebfs/blob/master/index.js#L37

  // rimraf.sync(path.join(fixtures, '.dweb'))
  // DWeb(fixtures, function (err, dweb) {
  //   t.error(err, 'error')
  //   dweb.close(function (err) {
  //     t.error(err, 'error')
  //     DWeb(fixtures, {key: '6161616161616161616161616161616161616161616161616161616161616161'}, function (err, dweb) {
  //       t.same(err.message, 'Another ddatabase is stored here', 'has error')
  //       rimraf.sync(path.join(fixtures, '.dweb'))
  //       t.end()
  //     })
  //   })
  // })
})

test('misc: make dweb with random key and open again', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'error')
    var key = '6161616161616161616161616161616161616161616161616161616161616161'
    DWeb(downDir, { key: key }, function (err, dweb) {
      t.error(err, 'error')
      t.ok(dweb, 'has dweb')
      dweb.close(function (err) {
        t.error(err, 'error')
        DWeb(downDir, { key: key }, function (err, dweb) {
          t.error(err, 'error')
          t.ok(dweb, 'has dweb')
          t.end()
        })
      })
    })
  })
})

test('misc: close order', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'opened tmp dir')
    DWeb(downDir, { watch: true }, function (err, dweb) {
      t.error(err, 'dweb properly opened')
      dweb.importFiles(function (err) {
        t.error(err, 'started importing files')
        t.ok(dweb.importer, 'importer exists')
        dweb.joinNetwork({ dht: false }, function (err) {
          t.error(err, 'joined network')
          var order = []
          dweb.network.on('error', function (err) {
            t.error(err)
          })
          dweb.network.on('close', function () {
            order.push('network')
          })
          dweb.importer.on('destroy', function () {
            order.push('importer')
          })
          dweb.archive.metadata.on('close', function () {
            order.push('metadata')
          })
          dweb.archive.content.on('close', function () {
            order.push('content')
            t.deepEquals(order, ['network', 'importer', 'metadata', 'content'], 'Close order as expected')
            t.end()
          })
          dweb.close()
        })
      })
    })
  })
})
