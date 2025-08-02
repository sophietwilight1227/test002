// router.ts
import { createRouter,createWebHistory } from 'vue-router';
import App from '@/App.vue'
 
const routes = [
    { path: '/', name: 'home', component: App },
    { path: '/Preview', 
      name: 'preview',     
      beforeEnter() {
          console.log("test")
      }},
]
 
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL), // HTML5 History モード
    routes,
})
 
export default router;