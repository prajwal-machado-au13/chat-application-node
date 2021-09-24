const fs = require('fs')
const map = require('map-async')
const path = require('path')
const tape = require('tape')
const getport = require('getport')
const request = require('request')
const { fork } = require('child_process')

tape('./01-server.js', function (t) {
  testServerFile('./01-server.js', function (err, origin, cb) {
    if (err) return t.error(err)

    request(origin, function (err, req, body) {
      if (err) return t.error(err)

      t.equal(body, 'hi')

      cb(t.end)
    })
  })
})

tape('./02-server.js', function (t) {
  testServerFile('./02-server.js', function (err, origin, cb) {
    if (err) return t.error(err)

    request(origin, function (err, req, body) {
      if (err) return t.error(err)

      t.equal(body, '{"text":"hi","numbers":[1,2,3]}')

      cb(t.end)
    })
  })
})

tape('./03-server.js', function (t) {
  testServerFile('./03-server.js', function (err, origin, cb) {
    if (err) return t.error(err)

    const expected = {
      '/': 'hi',
      '/json': '{"text":"hi","numbers":[1,2,3]}'
    }

    map(expected, function (exp, path, cb) {
      request(origin + path, (err, req, body) => cb(err, body))
    }, function (err, result) {
      if (err) return t.error(err)
      Object.keys(expected).forEach(k => t.equal(expected[k], result[k]))
      cb(t.end)
    })
  })
})

tape('./04-server.js', function (t) {
  testServerFile('./04-server.js', function (err, origin, cb) {
    if (err) return t.error(err)

    const expected = {
      '/': 'hi',
      '/json': '{"text":"hi","numbers":[1,2,3]}',
      '/echo?input=hello there': '{"normal":"hello there","shouty":"HELLO THERE","characterCount":11,"backwards":"ereht olleh"}'
    }

    map(expected, function (exp, path, cb) {
      request(origin + path, (err, req, body) => cb(err, body))
    }, function (err, result) {
      if (err) return t.error(err)
      Object.keys(expected).forEach(k => t.equal(expected[k], result[k]))
      cb(t.end)
    })
  })
})

tape('./05-server.js', function (t) {
  testServerFile('./05-server.js', function (err, origin, cb) {
    if (err) return t.error(err)

    const expected = {
      '/': 'hi',
      '/json': '{"text":"hi","numbers":[1,2,3]}',
      '/echo?input=hello there': '{"normal":"hello there","shouty":"HELLO THERE","characterCount":11,"backwards":"ereht olleh"}',
      '/static/index.html': fs.readFileSync(path.join(__dirname, '../public/index.html'), 'ascii'),
      '/static/notfound': 'Not Found'
    }

    map(expected, function (exp, path, cb) {
      request(origin + path, (err, req, body) => cb(err, body))
    }, function (err, result) {
      if (err) return t.error(err)
      Object.keys(expected).forEach(k => t.equal(expected[k], result[k]))
      cb(t.end)
    })
  })
})

tape('./06-server.js', function (t) {
  testServerFile('./06-server.js', function (err, origin, cb) {
    if (err) return t.error(err)

    const expected = {
      '/': 'hi',
      '/json': '{"text":"hi","numbers":[1,2,3]}',
      '/echo?input=hello there': '{"normal":"hello there","shouty":"HELLO THERE","characterCount":11,"backwards":"ereht olleh"}',
      '/static/index.html': fs.readFileSync(path.join(__dirname, '../public/index.html'), 'ascii'),
      '/static/notfound': 'Not Found'
    }

    map(expected, function (exp, path, cb) {
      request(origin + path, (err, req, body) => cb(err, body))
    }, function (err, result) {
      if (err) return t.error(err)
      Object.keys(expected).forEach(k => t.equal(expected[k], result[k]))
      cb(t.end)
    })
  })
})

tape('./07-server.js', function (t) {
  testServerFile('./07-server.js', function (err, origin, cb) {
    if (err) return t.error(err)

    request(origin + '/sse')
      .on('error', err => t.error(err))
      .on('data', (data) => {
        t.equal(data.toString(), 'data: hi\n\n')
        cb(t.end)
      })

    request(origin + '/chat?message=hi', function (err, res) {
      if (err) return t.error(err)
      t.equal(res.statusCode, 200, 'status code should be 200')
    })
  })
})

function testServerFile (filename, cb) {
  getport(5000, function (err, port) {
    if (err) return cb(err)

    const server = fork(filename, { env: { PORT: port }, silent: true })
    server.stdout.once('data', function (msg) {
      cb(null, `http://localhost:${port}`, function (fn) {
        server.on('close', fn)
        server.kill()
      })
    })
  })
}
