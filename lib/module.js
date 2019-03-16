module.exports = async function NuxtLoadingScreen() {
  if (!this.options.dev) {
    return
  }

  const LoadingUI = require('./loading')
  const loading = new LoadingUI(this.nuxt)
  await loading.init()

  this.addServerMiddleware({
    path: '/_loading',
    handler: loading.app
  })
}
