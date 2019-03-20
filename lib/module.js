module.exports = async function NuxtLoadingScreen() {
  if (!this.options.dev) {
    return
  }

  const LoadingUI = require('./loading')
  const loading = new LoadingUI()
  await loading.init()

  this.addServerMiddleware({
    path: '/_loading',
    handler: loading.app
  })

  this.nuxt.hook('bundler:progress', (states) => {
    loading.setStates(states)
  })

  this.nuxt.hook('server:nuxt:renderLoading', (req, res) => {
    loading.serveIndex(req, res)
  })

  this.nuxt.hook('listen', (server) => {
    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/_loading/ws') {
        loading.handleUpgrade(request, socket, head)
      }
    })
  })
}
