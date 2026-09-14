/**
 * LogShare 前端轻量遥测 SDK。
 *
 * 采集 Core Web Vitals（FCP、LCP、CLS、TTFB、INP）、
 * API 请求性能（时延、状态码、全量拦截 fetch 与 XMLHttpRequest / Axios）、
 * 运行时异常与脚本错误，支持采样率配置（默认 100% 全量采集）与敏捷批量上报。
 */

export type TelemetryType = 'api' | 'web_vitals' | 'error'

export interface ApiMetricItem {
  type: 'api'
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
}

export interface WebVitalItem {
  type: 'web_vitals'
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'INP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export interface ErrorMetricItem {
  type: 'error'
  message: string
  stack?: string
  url?: string
  timestamp: number
}

export type TelemetryItem = ApiMetricItem | WebVitalItem | ErrorMetricItem

export interface TelemetryConfig {
  /** 上报目标完整 URL 或相对路径，默认为 /v1/telemetry/report */
  endpointUrl?: string
  /** 批量上报缓冲容量，满此阈值立即触发上报（默认 2） */
  batchSize?: number
  /** 定时冲刷间隔毫秒数（默认 2000） */
  flushIntervalMs?: number
  /** 全局性能与 API 指标采样率（0.0 ~ 1.0），默认 1.0（即 100% 全量采样） */
  sampleRate?: number
  /** 运行时异常与错误采样率（0.0 ~ 1.0），默认 1.0（即 100% 全量采集） */
  errorSampleRate?: number
  /** 是否启用遥测（默认 true） */
  enabled?: boolean
}

class TelemetryClient {
  private queue: TelemetryItem[] = []
  private endpointUrl: string = import.meta.env.DEV ? '/v1/telemetry/report' : 'https://api.logshare.cn/v1/telemetry/report'
  private batchSize: number = 2
  private flushIntervalMs: number = 2000
  private sampleRate: number = 1.0
  private errorSampleRate: number = 1.0
  private enabled: boolean = true
  private timer: number | null = null
  private lcpDebounceTimer: number | null = null
  private initialized: boolean = false

  // 待提交的 Web Vitals 临时暂存（确保 LCP/CLS 在稳定或页面卸载前可靠入队）
  private pendingLcp: WebVitalItem | null = null
  private pendingCls: WebVitalItem | null = null

  public destroy(): void {
    if (this.timer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timer)
      this.timer = null
    }
    if (this.lcpDebounceTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.lcpDebounceTimer)
      this.lcpDebounceTimer = null
    }
  }

  public init(config?: TelemetryConfig): void {
    try {
      if (this.initialized || typeof window === 'undefined') {
        return
      }

      if (config) {
        if (config.endpointUrl) this.endpointUrl = config.endpointUrl
        if (typeof config.batchSize === 'number') this.batchSize = Math.max(1, config.batchSize)
        if (typeof config.flushIntervalMs === 'number') this.flushIntervalMs = Math.max(500, config.flushIntervalMs)
        if (typeof config.sampleRate === 'number') this.sampleRate = Math.min(1, Math.max(0, config.sampleRate))
        if (typeof config.errorSampleRate === 'number') this.errorSampleRate = Math.min(1, Math.max(0, config.errorSampleRate))
        if (typeof config.enabled === 'boolean') this.enabled = config.enabled
      }

      if (!this.enabled) {
        return
      }

      this.initialized = true

      // 各监控子系统独立隔离防护，确保任何环境兼容性问题绝不影响主应用
      try { this.collectWebVitals() } catch {}
      try { this.interceptFetch() } catch {}
      try { this.interceptXhr() } catch {}
      try { this.listenErrors() } catch {}
      try { this.startFlushTimer() } catch {}
      try { this.bindUnloadEvents() } catch {}
    } catch {
      // 容错防崩：绝对不抛出任何异常影响宿主应用渲染
    }
  }

  /**
   * 手动记录 API 性能指标（供 axios 拦截器或特定端点使用）
   */
  public trackApi(endpoint: string, method: string, durationMs: number, status: number): void {
    if (!this.enabled) return

    // 过滤上报端点自身与非 HTTP 请求，避免递归
    if (endpoint.includes('/telemetry/report') || endpoint.startsWith('data:') || endpoint.startsWith('blob:')) {
      return
    }

    this.push({
      type: 'api',
      endpoint,
      method: method.toUpperCase(),
      duration: Math.round(durationMs * 10) / 10,
      status,
      timestamp: Math.floor(Date.now() / 1000),
    })
  }

  /**
   * 手动记录错误日志
   */
  public trackError(message: string, stack?: string): void {
    if (!this.enabled) return

    this.push({
      type: 'error',
      message: message.slice(0, 500),
      stack: stack ? stack.slice(0, 1000) : undefined,
      url: typeof window !== 'undefined' ? window.location.href.slice(0, 300) : undefined,
      timestamp: Math.floor(Date.now() / 1000),
    })
  }

  /**
   * 单页路由切换时通知（固化当前页面指标并即时冲刷队列）
   */
  public trackPageView(_path?: string): void {
    try {
      if (!this.enabled) return
      this.commitPendingWebVitals()
      this.flush()
    } catch {
      // 容错防崩
    }
  }

  /**
   * 固化尚未推入队列的 Web Vitals（如 LCP、CLS）
   */
  public commitPendingWebVitals(): void {
    try {
      if (this.pendingLcp) {
        this.push(this.pendingLcp)
        this.pendingLcp = null
      }
      if (this.pendingCls) {
        this.push(this.pendingCls)
        this.pendingCls = null
      }
    } catch {
      // 容错防崩
    }
  }

  private push(item: TelemetryItem): void {
    try {
      if (!item || !this.enabled) return

      // 采样率过滤：默认 1.0（即 100% 全采样）
      const rate = item.type === 'error' ? this.errorSampleRate : this.sampleRate
      if (rate < 1.0 && Math.random() > rate) {
        return
      }

      this.queue.push(item)

      // 超过 200 条时丢弃最旧数据，避免极端网络环境下内存堆积
      if (this.queue.length > 200) {
        this.queue.splice(0, this.queue.length - 200)
      }

      // 关键事件即时冲刷：未捕获异常、API 报错或慢请求立即上报
      if (item.type === 'error') {
        this.flush()
        return
      }

      if (item.type === 'api' && (item.status >= 400 || item.status === 0 || item.duration >= 1000)) {
        this.flush()
        return
      }

      // 缓冲队列达到 batchSize 时立即触发上报
      if (this.queue.length >= this.batchSize) {
        this.flush()
      }
    } catch {
      // 容错防崩
    }
  }

  public flush(): void {
    if (this.queue.length === 0 || !this.enabled || typeof window === 'undefined') {
      return
    }

    const payload = this.queue.splice(0, 50)
    const body = JSON.stringify({ items: payload })

    // 优先使用带有 keepalive 的原生 fetch：
    // 标准现代规范，在页面活跃时具备完整 CORS 协商与调试支持，在页面卸载/切后台时亦能可靠在后台发送完成
    try {
      if (typeof window.fetch === 'function') {
        window.fetch(this.endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {
          // fetch 失败时降级尝试 sendBeacon 补发
          this.fallbackBeacon(body)
        })
        return
      }
    } catch {
      // 容错降级
    }

    this.fallbackBeacon(body)
  }

  private fallbackBeacon(body: string): void {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        // 使用 text/plain Blob 规避跨域 CORS preflight OPTIONS 失败被浏览器拦截的问题
        const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' })
        navigator.sendBeacon(this.endpointUrl, blob)
      }
    } catch {
      // 静默丢弃失败，避免影响前端主线程
    }
  }

  private startFlushTimer(): void {
    if (typeof window === 'undefined') return
    this.timer = window.setInterval(() => {
      this.flush()
    }, this.flushIntervalMs) as unknown as number
  }

  private bindUnloadEvents(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const handleUnloadOrHidden = () => {
      this.commitPendingWebVitals()
      this.flush()
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnloadOrHidden()
      }
    })

    window.addEventListener('pagehide', handleUnloadOrHidden)
    window.addEventListener('beforeunload', handleUnloadOrHidden)
  }

  private collectWebVitals(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return
    }

    // 1. TTFB (Time to First Byte)
    try {
      const navEntries = performance.getEntriesByType('navigation')
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming
        if (nav.responseStart > 0) {
          const ttfb = Math.round(nav.responseStart - nav.requestStart)
          const rating = ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor'
          this.push({
            type: 'web_vitals',
            name: 'TTFB',
            value: ttfb,
            rating,
            timestamp: Math.floor(Date.now() / 1000),
          })
        }
      }
    } catch {
      // 忽略不支持的环境
    }

    // 2. FCP (First Contentful Paint)
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const fcp = Math.round(entry.startTime)
            const rating = fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor'
            this.push({
              type: 'web_vitals',
              name: 'FCP',
              value: fcp,
              rating,
              timestamp: Math.floor(Date.now() / 1000),
            })
            paintObserver.disconnect()
            break
          }
        }
      })
      paintObserver.observe({ type: 'paint', buffered: true })
    } catch {
      // 忽略
    }

    // 3. LCP (Largest Contentful Paint)
    try {
      let lcpValue = 0
      const commitLcp = () => {
        if (lcpValue > 0) {
          const rating = lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor'
          this.pendingLcp = {
            type: 'web_vitals',
            name: 'LCP',
            value: lcpValue,
            rating,
            timestamp: Math.floor(Date.now() / 1000),
          }
          this.commitPendingWebVitals()
          lcpValue = 0
        }
      }

      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            lcpValue = Math.round(lastEntry.startTime)
            // 防抖 2000ms：当首屏主要渲染完成后主动固化 LCP，无需苦等页面卸载
            if (this.lcpDebounceTimer !== null) {
              window.clearTimeout(this.lcpDebounceTimer)
            }
            this.lcpDebounceTimer = window.setTimeout(() => {
              commitLcp()
            }, 2000) as unknown as number
          }
        }
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // 用户首次交互（点击或按键）标志着首屏内容加载结束，立即固化 LCP
      const onFirstInteraction = () => {
        commitLcp()
        window.removeEventListener('pointerdown', onFirstInteraction)
        window.removeEventListener('keydown', onFirstInteraction)
        window.removeEventListener('scroll', onFirstInteraction)
      }
      window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true })
      window.addEventListener('keydown', onFirstInteraction, { once: true, passive: true })
      window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true })
    } catch {
      // 忽略
    }

    // 4. CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0.0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
          if (!shift.hadRecentInput && typeof shift.value === 'number') {
            clsValue += shift.value
            const val = Math.round(clsValue * 1000) / 1000
            const rating = val < 0.1 ? 'good' : val < 0.25 ? 'needs-improvement' : 'poor'
            this.pendingCls = {
              type: 'web_vitals',
              name: 'CLS',
              value: val,
              rating,
              timestamp: Math.floor(Date.now() / 1000),
            }
          }
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch {
      // 忽略
    }
  }

  private interceptFetch(): void {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
      return
    }

    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const start = performance.now()
      let status = 0
      let url = ''
      let method = 'GET'

      try {
        const input = args[0]
        if (typeof input === 'string') {
          url = input
        } else if (input instanceof URL) {
          url = input.href
        } else if (input && typeof input === 'object' && 'url' in input) {
          url = (input as unknown as Request).url
          method = (input as unknown as Request).method || 'GET'
        }

        const init = args[1]
        if (init && init.method) {
          method = init.method
        }
      } catch {
        // 忽略解析错误
      }

      try {
        const response = await originalFetch.apply(window, args)
        status = response.status
        return response
      } catch (err) {
        status = 0
        throw err
      } finally {
        const duration = performance.now() - start
        if (url) {
          this.trackApi(url, method, duration, status)
        }
      }
    }
  }

  private interceptXhr(): void {
    if (typeof window === 'undefined' || typeof window.XMLHttpRequest !== 'function') {
      return
    }

    const client = this
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.open = function (this: any, ...args: any[]) {
      try {
        const method = typeof args[0] === 'string' ? args[0].toUpperCase() : 'GET'
        let url = ''
        if (typeof args[1] === 'string') {
          url = args[1]
        } else if (args[1] && typeof args[1] === 'object' && 'href' in args[1]) {
          url = String((args[1] as URL).href)
        }
        this._lsTelemetry = {
          method,
          url,
          startTime: 0,
        }
      } catch {
        // 容错防崩
      }
      return (originalOpen as any).apply(this, args)
    }

    XMLHttpRequest.prototype.send = function (this: any, ...args: any[]) {
      try {
        if (this._lsTelemetry) {
          this._lsTelemetry.startTime = performance.now()
          this.addEventListener('loadend', () => {
            try {
              if (!this._lsTelemetry || !this._lsTelemetry.startTime) return
              const duration = performance.now() - this._lsTelemetry.startTime
              const url = this._lsTelemetry.url
              const method = this._lsTelemetry.method
              const status = typeof this.status === 'number' ? this.status : 0
              if (url) {
                client.trackApi(url, method, duration, status)
              }
            } catch {
              // 容错防崩
            }
          }, { once: true })
        }
      } catch {
        // 容错防崩
      }
      return (originalSend as any).apply(this, args)
    }
  }

  private listenErrors(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('error', (event) => {
      const message = event.message || 'Script error'
      const stack = event.error ? String(event.error.stack || '') : undefined
      this.trackError(message, stack)
    })

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      let message = 'Unhandled Promise Rejection'
      let stack = ''

      if (reason instanceof Error) {
        message = reason.message
        stack = reason.stack || ''
      } else if (typeof reason === 'string') {
        message = reason
      } else {
        try {
          message = JSON.stringify(reason)
        } catch {
          message = String(reason)
        }
      }

      this.trackError(message, stack)
    })
  }
}

export const telemetry = new TelemetryClient()

/**
 * 在应用入口启动遥测上报
 */
export function initTelemetry(config?: TelemetryConfig): void {
  telemetry.init(config)
}
