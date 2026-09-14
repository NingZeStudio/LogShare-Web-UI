import './assets/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTelemetry, telemetry } from './lib/telemetry'

// 初始化客户端轻量遥测（Core Web Vitals、API 性能与错误自动上报，默认 100% 全采样）
try {
  initTelemetry()
} catch (e) {
  console.warn('Telemetry init failed:', e)
}

const app = createApp(App)

app.use(router)

router.afterEach((to) => {
  try {
    telemetry.trackPageView(to.fullPath)
  } catch {
    // 容错防崩
  }
})

router.isReady().then(() => {
  app.mount('#app')
})

// 警告：Service Worker 更新机制依赖 CustomEvent，修改时需测试 PWA 更新流程
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
    } catch (error) {
      console.error('Service Worker 注册失败:', error)
    }
  })
}
