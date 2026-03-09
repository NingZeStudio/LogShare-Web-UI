import './assets/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

/**
 * 注册 Service Worker
 * 检测应用更新并通知用户
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker 注册成功:', registration.scope)

      // 检测更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (!newWorker) {
          return
        }

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 有新版本可用，通知用户
            console.log('检测到应用更新，请刷新页面以应用更新')

            // 通过 BroadcastChannel 通知应用
            const updateChannel = new BroadcastChannel('pwa-update')
            updateChannel.postMessage({
              type: 'UPDATE_AVAILABLE',
              message: '发现新版本，刷新页面以应用更新'
            })

            // 触发全局事件
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

      // 监听 SW 消息
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('Service Worker 更新可用')
        }
      })
    } catch (error) {
      console.error('Service Worker 注册失败:', error)
    }
  })
}
