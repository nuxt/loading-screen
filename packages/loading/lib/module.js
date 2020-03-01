module.exports = async function NuxtLoadingScreen () {
  if (!this.options.dev) {
    return
  }
  const LoadingUI = require('./loading')

  const baseURL = this.options.router.base
  const loadingScreen = this.options.loadingScreen
  const loading = new LoadingUI({ baseURL, loadingScreen })
  await loading.init()

  this.addServerMiddleware({
    path: '/_loading', // baseURL will be prepended by nuxt for middleware
    handler: loading.app
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
