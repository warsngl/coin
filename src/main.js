import { createApp } from 'vue'
import { createRouter,createWebHashHistory } from 'vue-router'

import App from './App.vue'
import './assets/index.css'
import Home from './components/Home.vue'
import Copy from './components/Copy.vue'

const routes=[
  {path:'/', component: Home},
  {path:'/copy', component: Copy},
]
const router = createRouter({
  history: createWebHashHistory(),
  routes, 
})

createApp(App).use(router).mount('#app')
