import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { configureClient } from './api/client'
import { useAuthStore } from './stores/auth'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Wire the API client to the session before the router mounts, so the first
// navigation already carries a token. Done here rather than by importing the
// store inside the client, which would make the two modules circular.
const auth = useAuthStore(pinia)
configureClient({
  readToken: () => auth.token,
  onUnauthorized: () => auth.handleUnauthorized(),
})

app.use(router)
app.mount('#app')
