const path = require('path')
const connect = require('connect')
const serveStatic = require('serve-static')
const WebSocket = require('ws')
const fs = require('fs-extra')

class LoadingUI {
  constructor() {
    this.states = []

    this.serveIndex = this.serveIndex.bind(this)
    this.serveWS = this.serveWS.bind(this)
  }

  async init() {
    // Create a connect middleware stack
    this.app = connect()

    // Create and serve ws
    this.wss = new WebSocket.Server({ noServer: true })
    this.app.use('/ws', this.serveWS)

    // Serve dist
    const distPath = path.resolve(__dirname, '..', 'app-dist')
    this.app.use('/', serveStatic(distPath))

    // Serve index.html
    const indexPath = path.resolve(distPath, 'index.html')
    this.indexTemplate = await fs.readFile(indexPath, 'utf-8')
    this.app.use('/', this.serveIndex)
  }

  get state() {
    return {
      states: this.states
    }
  }

  setStates(states) {
    this.states = states
    this.broadcastState()
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

  serveIndex(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(this.indexTemplate)
  }

  serveWS(req) {
    this.handleUpgrade(req, req.socket, undefined)
  }

  handleUpgrade(request, socket, head) {
    return this.wss.handleUpgrade(request, socket, head, (client) => {
      this.wss.emit('connection', client, request)
      this.broadcastState()
    })
  }
}

module.exports = LoadingUI
