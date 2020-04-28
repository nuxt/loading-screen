module.exports = {
  entry: './app/index.js',
  output: {
    publicUrl: '{BASE_URL}',
    dir: 'app-dist',
    html: {
      template: 'app/index.html',
      title: 'Nuxt.js: Loading app...'
    }
  }
}
