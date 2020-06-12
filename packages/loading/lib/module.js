module.exports = function NuxtLoadingScreen () {
  const { nuxt } = this

  if (!this.options.dev) {
    return
  }

  const LoadingUI = require('./loading')

  const loading = new LoadingUI({
    baseURL: nuxt.options.router.base + '_loading'
  })

  nuxt.options.serverMiddleware.push({
    path: '/_loading',
    handler: (req, res) => { loading.app(req, res) }
  })

  nuxt.hook('listen', async (_, { url }) => {
    await loading.initAlt({ url })
    nuxt.options._loadingScreenBaseURL = loading.baseURLAlt
  })

  nuxt.hook('close', async () => {
    await loading.close()
  })

  nuxt.hook('bundler:progress', (states) => {
    loading.setStates(states)
  })

  nuxt.hook('cli:buildError', (error) => {
    loading.setError(error)
  })

  nuxt.hook('server:nuxt:renderLoading', (req, res) => {
    loading.serveIndex(req, res)
  })
}
