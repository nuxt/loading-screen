const { status, header } = require('node-res')

class SSE {
  constructor () {
    this.subscriptions = new Set()
    this.counter = 0
  }

  // Subscribe to a channel and set initial headers
  subscribe (req, res) {
    req.socket.setTimeout(0)

    status(res, 200)
    header(res, 'Content-Type', 'text/event-stream')
    header(res, 'Cache-Control', 'no-cache')
    header(res, 'Connection', 'keep-alive')

    this.subscriptions.add(res)
    res.on('close', () => this.subscriptions.delete(res))
    this.broadcast('ready', {})
  }

  // Publish event and data to all connected clients
  broadcast (event, data) {
    this.counter++
    // Do console.log(this.subscriptions.size) to see, if there are any memory leaks
    for (const res of this.subscriptions) {
      this.clientBroadcast(res, event, data)
    }
  }

  // Publish event and data to a given response object
  clientBroadcast (res, event, data) {
    res.write(`id: ${this.counter}\n`)
    res.write(`event: message\n`)
    res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`)
  }
}

module.exports = SSE
