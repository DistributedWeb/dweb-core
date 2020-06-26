# dwebs-core

> **dwebs-core** is a high-level module for building DWeb applications on the file system.

[![npm][0]][1] [![Travis][2]][3] [![Test coverage][4]][5] [![Greenkeeper badge](https://badges.greenkeeper.io/datproject/dwebs-core.svg)](https://greenkeeper.io/)

[DWeb](http://dwebx.org) is a decentralized tool for distributing data and
files, built for scientific and research data.
You can start using DWeb today in these client applications:

* [DWeb Command Line](https://github.com/datproject/dweb): Use DWeb in the command line
* [DWeb Desktop](https://github.com/datproject/dweb-desktop): A desktop application for DWeb
* [DBrowser Browser](https://dbrowser.com): An experimental P2P browser with DWeb built in

#### DWeb Project Documentation & Resources

* [DWeb Project Docs](http://docs.dwebx.org/)
* [DWeb Protocol](https://www.dwebx.net/)
* [Gitter Chat](https://gitter.im/datproject/discussions) or [#dweb on IRC](http://webchat.freenode.net/?channels=dweb)

### Features

* High-level glue for common DWeb and [dwebfs](https://github.com/distributedweb/dwebfs) modules.
* Sane defaults and consistent management of storage & secret keys across applications, using [dweb-storage](https://github.com/datproject/dweb-storage).
* Easily connect to the DWeb network, using [dweb-discovery-swarm](https://github.com/distributedweb/dweb-discovery-swarm)
* Import files from the file system, using [mirror-folder](https://github.com/distributedweb/mirror-folder/)
* Serve dwebs over http with [dwebfs-http](https://github.com/joehand/dwebfs-http)
* Access APIs to lower level modules with a single `require`!

#### Browser Support

Many of our dependencies work in the browser, but `dwebs-core` is tailored for file system applications. See [dweb-js](https://github.com/datproject/dweb-js) if you want to build browser-friendly DWeb applications.

## Example

To send files via DWeb:

1. Tell dwebs-core where the files are.
2. Import the files.
3. Share the files on the DWeb network! (And share the link)

```js
var DWeb = require('dwebs-core')

// 1. My files are in /joe/cat-pic-analysis
DWeb('/joe/cat-pic-analysis', function (err, dweb) {
  if (err) throw err

  // 2. Import the files
  dweb.importFiles()

  // 3. Share the files on the network!
  dweb.joinNetwork()
  // (And share the link)
  console.log('My DWeb link is: dweb://', dweb.key.toString('hex'))
})
```

These files are now available to share over the dweb network via the key printed in the console.

To download the files, you can make another dwebs-core instance in a different folder. This time we also have three steps:

1. Tell dweb where I want to download the files.
2. Tell dweb what the link is.
3. Join the network and download!

```js
var DWeb = require('dwebs-core')

// 1. Tell DWeb where to download the files
DWeb('/download/cat-analysis', {
  // 2. Tell DWeb what link I want
  key: '<dweb-key>' // (a 64 character hash from above)
}, function (err, dweb) {
  if (err) throw err

  // 3. Join the network & download (files are automatically downloaded)
  dweb.joinNetwork()
})
```

That's it! By default, all files are automatically downloaded when you connect to the other users.

Dig into more use cases below and please let us know if you have questions! You can [open a new issue](https://github.com/datproject/dwebs-core/issues) or talk to nice humans in [our chat room](https://gitter.im/datproject/discussions).

### Example Applications

* [DWeb CLI](https://github.com/datproject/dweb): We use dwebs-core in the dweb CLI.
* [DWeb Desktop](https://github.com/datproject/dweb-desktop): The DWeb Desktop application manages multiple dwebs-core instances via [dweb-worker](https://github.com/juliangruber/dweb-worker).
* See the [examples folder](examples) for a minimal share + download usage.
* And more! Let us know if you have a neat dwebs-core application to add here.

## Usage

All dwebs-core applications have a similar structure around three main elements:

1. **Storage** - where the files and metadata are stored.
2. **Network** - connecting to other users to upload or download data.
3. **Adding Files** - adding files from the file system to the dwebfs archive.

We'll go through what these are for and a few of the common usages of each element.

### Storage

Every dweb archive has **storage**, this is the required first argument for dwebs-core. By default, we use [dweb-storage](http://github.com/datproject/dweb-storage) which stores the secret key in `~/.dweb/` and the rest of the data in `dir/.dweb`. Other common options are:

* **Persistent storage**: Stored files in `/my-dir` and metadata in `my-dir/.dweb` by passing `/my-dir` as the first argument.
* **Temporary Storage**: Use the `temp: true` option to keep metadata stored in memory.

```js
// Permanent Storage
DWeb('/my-dir', function (err, dweb) {
  // Do DWeb Stuff
})

// Temporary Storage
DWeb('/my-dir', {temp: true}, function (err, dweb) {
  // Do DWeb Stuff
})
```

Both of these will import files from `/my-dir` when doing `dweb.importFiles()` but only the first will make a `.dweb` folder and keep the metadata on disk.

The storage argument can also be passed through to dwebfs for more advanced storage use cases.

### Network

DWeb is all about the network! You'll almost always want to join the network right after you create your DWeb:

```js
DWeb('/my-dir', function (err, dweb) {
  dweb.joinNetwork()
  dweb.network.on('connection', function () {
    console.log('I connected to someone!')
  })
})
```

#### Downloading Files

Remember, if you are downloading - metadata and file downloads will happen automatically once you join the network!

DWeb runs on a peer to peer network, sometimes there may not be anyone online for a particular key. You can make your application more user friendly by using the callback in `joinNetwork`:

```js
// Downloading <key> with joinNetwork callback
DWeb('/my-dir', {key: '<key>'}, function (err, dweb) {
  dweb.joinNetwork(function (err) {
    if (err) throw err

    // After the first round of network checks, the callback is called
    // If no one is online, you can exit and let the user know.
    if (!dweb.network.connected || !dweb.network.connecting) {
      console.error('No users currently online for that key.')
      process.exit(1)
    }
  })
})
```

##### Download on Demand

If you want to control what files and metadata are downloaded, you can use the sparse option:

```js
// Downloading <key> with sparse option
DWeb('/my-dir', {key: '<key>', sparse: true}, function (err, dweb) {
  dweb.joinNetwork()

  // Manually download files via the dwebfs API:
  dweb.archive.readFile('/cat-locations.txt', function (err, content) {
    console.log(content) // prints cat-locations.txt file!
  })
})
```

DWeb will only download metadata and content for the parts you request with `sparse` mode!

### Importing Files

There are many ways to get files imported into an archive! DWeb node provides a few basic methods. If you need more advanced imports, you can use the `archive.createWriteStream()` methods directly.

By default, just call `dweb.importFiles()` to import from the directory you initialized with. You can watch that folder for changes by setting the watch option:

```js
DWeb('/my-data', function (err, dweb) {
  if (err) throw err

  var progress = dweb.importFiles({watch: true}) // with watch: true, there is no callback
  progress.on('put', function (src, dest) {
    console.log('Importing ', src.name, ' into archive')
  })
})
```

You can also import from another directory:

```js
DWeb('/my-data', function (err, dweb) {
  if (err) throw err

  dweb.importFiles('/another-dir', function (err) {
    console.log('done importing another-dir')
  })
})
```

That covers some of the common use cases, let us know if there are more to add! Keep reading for the full API docs.

## API

### `DWeb(dir|storage, [opts], callback(err, dweb))`

Initialize a DWeb Archive in `dir`. If there is an existing DWeb Archive, the archive will be resumed.

#### Storage

* `dir` (Default) - Use [dweb-storage](https://github.com/datproject/dweb-storage) inside `dir`. This stores files as files, sleep files inside `.dweb`, and the secret key in the user's home directory.
* `dir` with `opts.latest: false` - Store as SLEEP files, including storing the content as a `content.data` file. This is useful for storing all history in a single flat file.
* `dir` with `opts.temp: true` - Store everything in memory (including files).
* `storage` function - pass a custom storage function along to dwebfs, see dweb-storage for an example.

Most options are passed directly to the module you're using (e.g. `dweb.importFiles(opts)`. However, there are also some initial `opts` can include:

```js
opts = {
  key: '<dweb-key>', // existing key to create archive with or resume
  temp: false, // Use random-access-memory as the storage.

  // DWebFs options
  sparse: false // download only files you request
}
```

The callback, `cb(err, dweb)`, includes a `dweb` object that has the following properties:

* `dweb.key`: key of the dweb (this will be set later for non-live archives)
* `dweb.archive`: DWebFs archive instance.
* `dweb.path`: Path of the DWeb Archive
* `dweb.live`: `archive.live`
* `dweb.writable`: Is the `archive` writable?
* `dweb.resumed`: `true` if the archive was resumed from an existing database
* `dweb.options`: All options passed to DWeb and the other submodules

### Module Interfaces

**`dwebs-core` provides an easy interface to common DWeb modules for the created DWeb Archive on the `dweb` object provided in the callback:**

#### `var network = dweb.joinNetwork([opts], [cb])`

Join the network to start transferring data for `dweb.key`, using [dweb-discovery-swarm](https://github.com/distributedweb/dweb-discovery-swarm). You can also use `dweb.join([opts], [cb])`.

If you specify `cb`, it will be called *when the first round* of discovery has completed. This is helpful to check immediately if peers are available and if not fail gracefully, more similar to http requests.

Returns a `network` object with properties:

* `network.connected` - number of peers connected
* `network.on('listening')` - emitted with network is listening
* `network.on('connection', connection, info)` - Emitted when you connect to another peer. Info is an object that contains info about the connection

##### Network Options

`opts` are passed to dweb-discovery-swarm, which can include:

```js
opts = {
  upload: true, // announce and upload data to other peers
  download: true, // download data from other peers
  port: 6620, // port for discovery swarm
  utp: true, // use utp in discovery swarm
  tcp: true // use tcp in discovery swarm
}

//Defaults from datland-swarm-defaults can also be overwritten:

opts = {
  dns: {
    server: // DNS server
    domain: // DNS domain
  }
  dht: {
    bootstrap: // distributed hash table bootstrapping nodes
  }
}
```

Returns a [dweb-discovery-swarm](https://github.com/distributedweb/dweb-discovery-swarm) instance.

#### `dweb.leaveNetwork()` or `dweb.leave()`

Leaves the network for the archive.

#### `var importer = dweb.importFiles([src], [opts], [cb])`

**Archive must be writable to import.**

Import files to your DWeb Archive from the directory using [mirror-folder](https://github.com/distributedweb/mirror-folder/).

* `src` - By default, files will be imported from the folder where the archive was initiated. Import files from another directory by specifying `src`.
* `opts` - options passed to mirror-folder (see below).
* `cb` - called when import is finished.

Returns a `importer` object with properties:

* `importer.on('error', err)`
* `importer.on('put', src, dest)` - file put started. `src.live` is true if file was added by file watch event.
* `importer.on('put-data', chunk)` - chunk of file added
* `importer.on('put-end', src, dest)` - end of file write stream
* `importer.on('del', dest)` - file deleted from dest
* `importer.on('end')` - Emits when mirror is done (not emitted in watch mode)
* If `opts.count` is true:
  * `importer.on('count', {files, bytes})` - Emitted after initial scan of src directory. See import progress section for details.
  * `importer.count` will be `{files, bytes}` to import after initial scan.
  * `importer.putDone` will track `{files, bytes}` for imported files.

##### Importer Options

Options include:

```js
var opts = {
  count: true, // do an initial dry run import for rendering progress
  ignoreHidden: true, // ignore hidden files  (if false, .dweb will still be ignored)
  ignoreDirs: true, // do not import directories (dwebfs does not need them and it pollutes metadata)
  useDatIgnore: true, // ignore entries in the `.datignore` file from import dir target.
  ignore: // (see below for default info) anymatch expression to ignore files
  watch: false, // watch files for changes & import on change (archive must be live)
}
```

##### Ignoring Files

You can use a `.datignore` file in the imported directory, `src`, to ignore any the user specifies. This is done by default.

`dwebs-core` uses [dweb-ignore](https://github.com/joehand/dweb-ignore) to provide a default ignore option, ignoring the `.dweb` folder and all hidden files or directories. Use `opts.ignoreHidden = false` to import hidden files or folders, except the `.dweb` directory.

*It's important that the `.dweb` folder is not imported because it contains a private key that allows the owner to write to the archive.*

#### `var stats = dweb.trackStats()`

##### `stats.on('update')`

Emitted when archive stats are updated. Get new stats with `stats.get()`.

##### `var st = dweb.stats.get()`

`dweb.trackStats()` adds a `stats` object to `dweb`.  Get general archive stats for the latest version:

```js
{
  files: 12,
  byteLength: 1234,
  length: 4, // number of blocks for latest files
  version: 6, // archive.version for these stats
  downloaded: 4 // number of downloaded blocks for latest
}
```

##### `stats.network`

Get upload and download speeds: `stats.network.uploadSpeed` or `stats.network.downloadSpeed`. Transfer speeds are tracked using [dwebfs-network-speed](https://github.com/joehand/dwebfs-network-speed/).

##### `var peers = stats.peers`

* `peers.total` - total number of connected peers
* `peers.complete` - connected peers with all the content data

#### `var server = dweb.serveHttp(opts)`

Serve files over http via [dwebfs-http](https://github.com/joehand/dwebfs-http). Returns a node http server instance.

```js
opts = {
  port: 8080, // http port
  live: true, // live update directory index listing
  footer: 'Served via DWeb.', // Set a footer for the index listing
  exposeHeaders: false // expose dweb key in headers
}
```

#### `dweb.pause()`

Pause all upload & downloads. Currently, this is the same as `dweb.leaveNetwork()`, which leaves the network and destroys the swarm. Discovery will happen again on `resume()`.

#### `dweb.resume()`

Resume network activity. Current, this is the same as `dweb.joinNetwork()`.

#### `dweb.close(cb)`

Stops replication and closes all the things opened for dwebs-core, including:

* `dweb.archive.close(cb)`
* `dweb.network.close(cb)`
* `dweb.importer.destroy()` (file watcher)

## License

MIT

[0]: https://img.shields.io/npm/v/dwebs-core.svg?style=flat-square
[1]: https://npmjs.org/package/dwebs-core
[2]: https://img.shields.io/travis/datproject/dwebs-core/master.svg?style=flat-square
[3]: https://travis-ci.org/datproject/dwebs-core
[4]: https://img.shields.io/codecov/c/github/datproject/dwebs-core/master.svg?style=flat-square
[5]: https://codecov.io/github/datproject/dwebs-core
