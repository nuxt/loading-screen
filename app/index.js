import Vue from 'vue'
import App from './app.vue'

Vue.config.devtools = true
window._nuxtLoadingScreen = new Vue(App)
