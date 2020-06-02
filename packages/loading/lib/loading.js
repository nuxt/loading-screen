const { resolve } = require('path')
const connect = require('connect')
const serveStatic = require('serve-static')
const fs = require('fs-extra')
const getPort = require('get-port-plz')
const { json, end, header } = require('node-res')

const { parseStack } = require('./utils/error')
const SSE = require('./sse')

class LoadingUI {
  constructor () {
    // Create a connect middleware stack
    this.app = connect()

    // Create an SSE handler instance
    this.sse = new SSE()

    this.baseURL = ''
    this._lastBroadCast = 0

    this.states = []
    this.allDone = true
    this.hasErrors = false

    this.serveIndex = this.serveIndex.bind(this)
  }

  async init ({ url }) {
    if (this._init) { return }
    this._init = true

    // Fix CORS
    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      next()
    })

    // Subscribe to SSR channel
    this.app.use('/sse', (req, res) => this.sse.subscribe(req, res))

    // Serve state with JSON
    this.app.use('/json', (req, res) => json(req, res, this.state))

    // Serve assets
    const distPath = resolve(__dirname, '../app-dist')
    this.app.use('/assets', serveStatic(resolve(distPath, 'assets')))

    // Load indexTemplate
    const indexPath = resolve(distPath, 'index.html')
    this.indexTemplate = await fs.readFile(indexPath, 'utf-8')

    // Redirect users directly open this port
    this.app.use('/', (req, res) => {
      res.setHeader('Location', url)
      res.statusCode = 307
      res.end(url)
    })

    // Start listening
    await this._listen()
  }

  async _listen () {
    if (this._server) {
      return
    }

    const port = await getPort({ random: true, name: 'nuxt_loading' })

    return new Promise((resolve, reject) => {
      this._server = this.app.listen(port, (err) => {
        if (err) { return reject(err) }
        this.baseURL = `http://localhost:${port}`
        resolve()
      })
    })
  }

  close () {
    if (this._server) {
      return new Promise((resolve, reject) => {
        this._server.close((err) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    }
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
