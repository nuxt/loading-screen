module.exports = function NuxtLoadingScreen () {
  if (!this.options.dev) {
    return
  }

  const defu = require('defu')
  const LoadingUI = require('./loading')

  const { nuxt } = this

  const options = defu(this.options.build.loadingScreen, {
    baseURL: nuxt.options.router.base + '_loading',
    altPort: !process.env.CODESANDBOX_SSE,
    image: undefined,
    colors: {}
  })

  nuxt.options._loadingScreenBaseURL = options.baseURL

  const loading = new LoadingUI(options)

  nuxt.options.serverMiddleware.push({
    path: '/_loading',
    handler: (req, res) => { loading.app(req, res) }
  })

  if (options.altPort !== false) {
    nuxt.hook('listen', async (_, { url }) => {
      await loading.initAlt({ url })
      nuxt.options._loadingScreenBaseURL = loading.options.baseURLAlt
    })
  }

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
