module.exports = {
  entry: './app/index.js',
  output: {
    publicUrl: '__BASE_URL__',
    dir: 'app-dist',
    html: {
      template: 'app/index.html',
      title: 'Nuxt.js: Loading app...'
    }
  }
}
