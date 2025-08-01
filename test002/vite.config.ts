import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        //target: 'https://jbbs.shitaraba.net/bbs/rawmode.cgi',
        target:"cors-header-proxy.nanada0629.workers.dev",
        //target: process.env.USE_LOCAL_SERVER ? 'https://jbbs.shitaraba.net/bbs/rawmode.cgi' : 'https://helloworld.nanada0629.workers.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  base: '/test002/', //通常はこっち
  //base: '/',  //カスタムドメインを使うならこっち？
})
