const baseKey = '__nuxt_loading_screen_'

export default {
  methods: {
    createItemKey (key) {
      return `${baseKey}${key}`
    },

    storeItem (key, value) {
      try {
        sessionStorage.setItem(this.createItemKey(key), `${value}`)
      } catch (err) {
        console.error(err) // eslint-disable-line no-console
      }
    },

    retrieveItem (key) {
      return sessionStorage.getItem(this.createItemKey(key))
    },

    removeItem (key) {
      sessionStorage.removeItem(this.createItemKey(key))
    }
  }
}
