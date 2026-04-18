import './assets/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

// 警告：Service Worker 更新机制依赖 BroadcastChannel，修改时需测试 PWA 更新流程
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker 注册成功:', registration.scope)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (!newWorker) {
          return
        }

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('检测到应用更新，请刷新页面以应用更新')

            const updateChannel = new BroadcastChannel('pwa-update')
            updateChannel.postMessage({
              type: 'UPDATE_AVAILABLE',
              message: '发现新版本，刷新页面以应用更新'
            })

            window.dispatchEvent(
              new CustomEvent('pwa-update-available', {
                detail: {
                  message: '发现新版本，刷新页面以应用更新'
                }
              })
            )
          }
        })
      })

      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('Service Worker 更新可用')
        }
      })
    } catch (error) {
      console.error('Service Worker 注册失败:', error)
    }
  })
}
