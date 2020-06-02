module.exports = function NuxtLoadingScreen () {
  if (!this.options.dev) {
    return
  }
  const LoadingUI = require('./loading')
  const loading = new LoadingUI()

  this.nuxt.hook('listen', async (_, { url }) => {
    await loading.init({ url })
    this.nuxt.options._loadingScreenBaseURL = loading.baseURL
  })

  this.nuxt.hook('close', async () => {
    await loading.close()
  })

  this.nuxt.hook('bundler:progress', (states) => {
    loading.setStates(states)
  })

  this.nuxt.hook('cli:buildError', (error) => {
    loading.setError(error)
  })

  this.nuxt.hook('server:nuxt:renderLoading', (req, res) => {
    loading.serveIndex(req, res)
  })
}
