export default {
  methods: {
    logSse (...args) {
      this.log('[SSE]', ...args)
    },

    logSseError (...args) {
      this.logError('[SSE]', ...args)
    },

    sseConnect (path) {
      this.logSse(`Connecting to ${path}...`)

      this.$sse = new EventSource(path)
      this.$sse.addEventListener('message', event => this.onSseMessage(event))
    },

    onSseMessage (message) {
      const data = JSON.parse(message.data)

      data && this.onSseData && this.onSseData(data)
    },

    sseClose () {
      if (this.$sse) {
        this.$sse.close()
        delete this.$sse
      }
    }
  }
}
