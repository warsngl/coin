import { createApp } from 'vue'
import { createRouter,createWebHashHistory } from 'vue-router'

import App from './App.vue'
import './assets/index.css'
import Home from './components/Home.vue'

const routes=[
  {path:'/', component: Home},
]
const router = createRouter({
  history: createWebHashHistory(),
  routes, 
})

createApp(App).use(router).mount('#app')
