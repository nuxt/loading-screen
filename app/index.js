import Vue from 'vue'
import App from './app.vue'

if (window._nuxtLoadingScreen) {
  location.reload(true) // Workaround
} else {
  window._nuxtLoadingScreen = new Vue(App)
}
