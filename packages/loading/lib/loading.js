const { resolve } = require('path')
const connect = require('connect')
const serveStatic = require('serve-static')
const fs = require('fs-extra')
const { json, end, header } = require('node-res')

const { parseStack } = require('./utils/error')
const SSE = require('./sse')

class LoadingUI {
  constructor ({ baseURL }) {
    // Create a connect middleware stack
    this.app = connect()

    // Create an SSE handler instance
    this.sse = new SSE()

    this.baseURL = baseURL
    this._lastBroadCast = 0

    this.states = []
    this.allDone = true
    this.hasErrors = false

    this.serveIndex = this.serveIndex.bind(this)
  }

  async init () {
    // Fix CORS and prefix issue
    this.app.use((req, res, next) => {
      req.url = req.url.replace('/_loading', '')
      res.setHeader('Access-Control-Allow-Origin', '*')
      next()
    })

    // Subscribe to SSR channel
    this.app.use('/sse', (req, res) => this.sse.subscribe(req, res))

    // Serve state with JSON
    this.app.use('/json', (req, res) => json(req, res, this.state))

    // Serve dist
    const distPath = resolve(__dirname, '..', 'app-dist')
    this.app.use('/', serveStatic(distPath))

    // Serve index.html
    const indexPath = resolve(distPath, 'index.html')
    this.indexTemplate = await fs.readFile(indexPath, 'utf-8')
    this.app.use('/', this.serveIndex)
  }

  listen () {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(0, (err) => {
        if (err) {
          return reject(err)
        }
        const { port } = server.address()
        this.baseURL = `http://localhost:${port}/`
        resolve()
      })
    })
  }

  get state () {
    return {
      error: this.error,
      states: this.states,
      allDone: this.allDone,
      hasErrors: this.hasErrors
    }
  }

  setStates (states) {
    this.clearError()
    this.states = states
    this.allDone = this.states.every(state => state.progress === 0 || state.progress === 100)
    this.hasErrors = this.states.some(state => state.hasErrors === true)
    this.broadcastState()
  }

  setError (error) {
    this.clearStates(true)
    this.error = {
      description: error.toString(),
      stack: parseStack(error.stack).join('\n')
    }
    this.broadcastState()
  }

  clearError () {
    this.error = undefined
  }

  clearStates (hasErrors) {
    this.states = []
    this.allDone = false
    this.hasErrors = !!hasErrors
  }

  broadcastState () {
    const now = new Date()

    if ((now - this._lastBroadCast > 500) || this.allDone || this.hasErrors) {
      this.sse.broadcast('state', this.state)
      this._lastBroadCast = now
    }
  }

  serveIndex (req, res) {
    const html = this.indexTemplate
      .replace('{STATE}', JSON.stringify(this.state))
      .replace(/{BASE_URL}/g, this.baseURL)

    header(res, 'Content-Type', 'text/html')
    end(res, html)
  }
}

module.exports = LoadingUI
