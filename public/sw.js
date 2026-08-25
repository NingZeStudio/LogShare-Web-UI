/**
 * Service Worker for LogShare.CN PWA
 * 提供离线缓存和应用更新检测
 *
 * 缓存策略：
 * - 导航请求：网络优先，失败回落缓存的 index.html（离线兜底）
 * - /assets/ 带内容 hash 的静态资源：缓存优先
 * - 其余同源 GET：网络优先，失败回落缓存
 */

const CACHE_NAME = 'logshare-runtime-v2'
const OFFLINE_URL = '/index.html'

// 安装时预缓存的资源
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json']

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // 立即激活新的 SW
  self.skipWaiting()
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // 接管所有页面
  self.clients.claim()
})

// 将成功响应写入缓存（忽略配额等写入失败）
const putInCache = (request, response) => {
  caches.open(CACHE_NAME).then((cache) => {
    cache.put(request, response).catch(() => {})
  })
}

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 跳过跨域请求
  if (!request.url.startsWith(self.location.origin)) {
    return
  }

  // 带内容 hash 的构建产物：缓存优先
  if (request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            putInCache(request, response.clone())
            return response
          })
      )
    )
    return
  }

  // 页面导航：网络优先，离线回落缓存的 index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putInCache(request, response.clone())
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // 其余同源 GET：网络优先，失败回落缓存
  event.respondWith(
    fetch(request)
      .then((response) => {
        putInCache(request, response.clone())
        return response
      })
      .catch(() => caches.match(request))
  )
})

// 监听消息 - 处理更新
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
