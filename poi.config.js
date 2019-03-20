module.exports = {
  entry: './app/index.js',
  output: {
    publicUrl: '/_loading/',
    dir: 'app-dist',
    html: {
      template: 'app/index.html',
      title: 'Nuxt.js: Loading app...'
    }
  }
}
