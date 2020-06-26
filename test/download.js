var fs = require('fs')
var path = require('path')
var test = require('tape')
var rimraf = require('rimraf')
var tmpDir = require('temporary-directory')
var helpers = require('./helpers')

var DWeb = require('..')

// os x adds this if you view the fixtures in finder and breaks the file count assertions
try { fs.unlinkSync(path.join(__dirname, 'fixtures', '.DS_Store')) } catch (e) { /* ignore error */ }

var fixtures = path.join(__dirname, 'fixtures')

test('download: Download with default opts', function (t) {
  shareFixtures(function (err, shareKey, closeShare) {
    t.error(err, 'error')

    tmpDir(function (err, downDir, cleanup) {
      t.error(err, 'error')

      DWeb(downDir, { key: shareKey }, function (err, dweb) {
        t.error(err, 'error')
        t.ok(dweb, 'callsback with dweb object')
        t.ok(dweb.key, 'has key')
        t.ok(dweb.archive, 'has archive')
        t.notOk(dweb.writable, 'archive not writable')

        var stats = dweb.trackStats()
        var network = dweb.joinNetwork(function () {
          t.pass('joinNetwork calls back okay')
        })
        network.once('connection', function () {
          t.pass('connects via network')
        })
        var archive = dweb.archive
        archive.once('content', function () {
          t.pass('gets content')
          archive.content.on('sync', done)
        })

        function done () {
          var st = stats.get()
          t.ok(st.version === archive.version, 'stats version correct')
          t.ok(st.downloaded === st.length, 'all blocks downloaded')
          helpers.verifyFixtures(t, archive, function (err) {
            t.error(err, 'error')
            t.ok(dweb.network, 'network is open')
            dweb.close(function (err) {
              t.error(err, 'error')
              t.equal(dweb.network, undefined, 'network is closed')
              cleanup(function (err) {
                t.error(err, 'error')
                closeShare(function (err) {
                  t.error(err, 'error')
                  t.end()
                })
              })
            })
          })
        }
      })
    })
  })
})

// TODO:
// rest of download tests
// tests will be a lot better with some download-finished type check
// e.g. https://github.com/distributedweb/ddatabase/pull/86

// if (!process.env.TRAVIS) {
//   test('download and live update (new file)', function (t) {
//     var dweb = downloadDat // use previous test download
//     var archive = dweb.archive
//     var newFile = path.join(fixtures, 'new.txt')

//     archive.metadata.on('update', function () {
//       t.pass('metadata update fires')
//     })

//     archive.on('download-finished', function () {
//       t.skip('TODO: download finished fires again')
//     })

//     dweb.stats.once('update:filesTotal', function () {
//       t.same(dweb.stats.get().filesTotal, fixtureStats.filesTotal + 1, 'filesTotal has one more')
//     })

//     dweb.stats.on('update:blocksProgress', function () {
//       var st = dweb.stats.get()
//       // TODO: blocksProgress === blocksTotal (bug in stats?)
//       if (st.blocksTotal && st.blocksProgress >= st.blocksTotal) return done()
//     })

//     addShareFile()

//     function addShareFile () {
//       fs.writeFileSync(newFile, 'helloooooo')
//     }

//     function done () {
//       // shareDat file watching is closing without callback and causing trouble
//       dweb.close(function () {
//         fs.unlink(newFile, function () {
//           t.end()
//         })
//       })
//     }
//   })
// }

// test('Download with sparse', function (t) {
//   testFolder(function () {
//     DWeb(downloadDir, {key: shareKey, sparse: true}, function (err, dweb) {
//       t.error(err, 'no download init error')
//       t.ok(dweb, 'callsback with dweb object')
//       t.ok(dweb.options.sparse, 'sparse option set')
//       t.ok(dweb.archive.options.sparse, 'sparse option set')
//       t.ok(dweb.archive._sparse, 'sparse option set')

//       var archive = dweb.archive
//       downloadDat = dweb

//       archive.open(function () {
//         archive.get('table.csv', function (err, entry) {
//           t.ifError(err)
//           archive.download(entry, function (err) {
//             t.ifError(err)
//             done()
//           })
//         })
//       })

//       var network = dweb.joinNetwork()
//       network.once('connection', function () {
//         t.pass('connects via network')
//       })

//       function done () {
//         fs.readdir(downloadDir, function (_, files) {
//           var hasCsvFile = files.indexOf('table.csv') > -1
//           var hasDatFolder = files.indexOf('.dweb') > -1
//           t.ok(hasDatFolder, '.dweb folder created')
//           t.ok(hasCsvFile, 'csv file downloaded')
//           t.same(files.length, 2, 'two items in download dir')
//           downloadDat.close(function () {
//             t.end()
//           })
//         })
//       }
//     })
//   })
// })

// test('Download pause', function (t) {
//   testFolder(function () {
//     DWeb(downloadDir, {key: shareKey}, function (err, dweb) {
//       t.error(err, 'no download init error')

//       var paused = false
//       dweb.joinNetwork({ dht: false }).once('connection', function () {
//         dweb.pause()
//         paused = true

//         dweb.archive.on('download', failDownload)

//         setTimeout(function () {
//           dweb.archive.removeListener('download', failDownload)
//           dweb.resume()
//           paused = false
//         }, 500)

//         function failDownload () {
//           if (paused) t.fail('download when paused')
//         }
//       })

//       dweb.archive.open(function () {
//         dweb.archive.content.on('download-finished', done)
//       })

//       function done () {
//         t.pass('finished download after resume')
//         if (dweb._closed) return
//         dweb.close(function (err) {
//           t.error(err, 'no error')
//           t.end()
//         })
//       }
//     })
//   })
// })

// test('download from snapshot', function (t) {
//   var shareKey
//   var snapshotDat
//   DWeb(fixtures, {live: false}, function (err, dweb) {
//     t.error(err, 'live: false share, no error')
//     snapshotDat = dweb
//     dweb.importFiles(function (err) {
//       t.error(err, 'import no error')
//       dweb.archive.finalize(function (err) {
//         t.error(err, 'no error')
//         shareKey = dweb.archive.key
//         dweb.joinNetwork()
//         download()
//       })
//     })
//   })

//   function download () {
//     testFolder(function () {
//       DWeb(downloadDir, { key: shareKey }, function (err, dweb) {
//         t.error(err, 'no download init error')
//         t.ok(dweb, 'callsback with dweb object')
//         t.ok(dweb.key, 'has key')
//         t.ok(dweb.archive, 'has archive')
//         t.ok(dweb.db, 'has db')
//         t.ok(dweb.owner === false, 'archive not owned')

//         var archive = dweb.archive

//         dweb.joinNetwork()

//         archive.open(function () {
//           t.ok(archive.live === false, 'archive.live is false')
//           archive.content.once('download-finished', function () {
//             done()
//           })
//         })

//         function done () {
//           fs.readdir(downloadDir, function (_, files) {
//             var hasCsvFile = files.indexOf('table.csv') > -1
//             var hasDatFolder = files.indexOf('.dweb') > -1
//             t.ok(hasDatFolder, '.dweb folder created')
//             t.ok(hasCsvFile, 'csv file downloaded')

//             dweb.close(function () {
//               t.pass('close callback ok')
//               snapshotDat.close(function () {
//                 rimraf.sync(path.join(fixtures, '.dweb'))
//                 t.end()
//               })
//             })
//           })
//         }
//       })
//     })
//   }
// })

// test.onFinish(function () {
//   rimraf.sync(downloadDir)
// })

function shareFixtures (opts, cb) {
  if (typeof opts === 'function') cb = opts
  if (!opts) opts = {}

  rimraf.sync(path.join(fixtures, '.dweb')) // for previous failed tests
  DWeb(fixtures, { temp: true }, function (err, dweb) {
    if (err) return cb(err)
    dweb.joinNetwork({ dht: false })
    dweb.importFiles(function (err) {
      if (err) return cb(err)
      cb(null, dweb.key, close)
    })

    function close (cb) {
      dweb.close(function (err) {
        cb(err)
        // rimraf if we need it?
      })
    }
  })
}
