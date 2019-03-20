const path = require('path')
const connect = require('connect')
const serveStatic = require('serve-static')
const WebSocket = require('ws')
const fs = require('fs-extra')

class LoadingUI {
  constructor(nuxt) {
    this.nuxt = nuxt
    this.options = nuxt.options

    this.states = []

    this.nuxt.hook('bundler:progress', (states) => {
      this.states = states
      this.broadcastState()
    })

    this.nuxt.hook('server:nuxt:renderLoading', (req, res) => {
      req.url = '/'
      this.app(req, res)
    })

    this.nuxt.hook('listen', (server) => {
      server.on('upgrade', (request, socket, head) => {
        if (request.url === '/_loading/ws') {
          this.handleUpgrade(request, socket, head)
        }
      })
    })
  }

  async init() {
    // Create a connect middleware stack
    this.app = connect()

    // Create and serve ws
    this.wss = new WebSocket.Server({ noServer: true })
    this.app.use('/ws', this.serveWS.bind(this))

    // Serve dist
    const distPath = path.resolve(__dirname, '..', 'app-dist')
    this.app.use('/', serveStatic(distPath))

    // Serve index.html
    const indexPath = path.resolve(distPath, 'index.html')
    this.indexTemplate = await fs.readFile(indexPath, 'utf-8')
    this.app.use('/', this.serverIndex.bind(this))
  }

  get state() {
    return {
      states: this.states
    }
  }

  broadcastState() {
    const data = JSON.stringify(this.state)

    for (const client of this.wss.clients) {
      try {
        client.send(data)
      } catch (err) {
        // Ignore error (if client not ready to receive event)
      }
    }
  }

  serverIndex(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(this.indexTemplate)
  }

  handleUpgrade(request, socket, head) {
    return this.wss.handleUpgrade(request, socket, head, (client) => {
      this.wss.emit('connection', client, request)
      this.broadcastState()
    })
  }

  serveWS(req) {
    this.handleUpgrade(req, req.socket, undefined)
  }
}

module.exports = LoadingUI
