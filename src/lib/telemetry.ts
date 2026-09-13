/**
 * LogShare 前端轻量遥测 SDK。
 *
 * 采集 Core Web Vitals（FCP、LCP、CLS、TTFB、INP）、
 * API 请求性能（时延、状态码）与前端运行时异常，自动防抖批量上报。
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
  /** 批量上报缓冲容量，满此阈值立即触发上报（默认 10） */
  batchSize?: number
  /** 定时冲刷间隔毫秒数（默认 5000） */
  flushIntervalMs?: number
  /** 是否启用遥测（默认 true） */
  enabled?: boolean
}

class TelemetryClient {
  private queue: TelemetryItem[] = []
  private endpointUrl: string = import.meta.env.DEV ? '/v1/telemetry/report' : 'https://api.logshare.cn/v1/telemetry/report'
  private batchSize: number = 10
  private flushIntervalMs: number = 5000
  private enabled: boolean = true
  private timer: number | null = null
  private initialized: boolean = false

  public destroy(): void {
    if (this.timer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  public init(config?: TelemetryConfig): void {
    if (this.initialized || typeof window === 'undefined') {
      return
    }

    if (config) {
      if (config.endpointUrl) this.endpointUrl = config.endpointUrl
      if (typeof config.batchSize === 'number') this.batchSize = config.batchSize
      if (typeof config.flushIntervalMs === 'number') this.flushIntervalMs = config.flushIntervalMs
      if (typeof config.enabled === 'boolean') this.enabled = config.enabled
    }

    if (!this.enabled) {
      return
    }

    this.initialized = true

    // 1. 采集 Core Web Vitals
    this.collectWebVitals()

    // 2. 劫持原生 fetch
    this.interceptFetch()

    // 3. 监听全局脚本与 Promise 未捕获错误
    this.listenErrors()

    // 4. 定时调度批量上报
    this.startFlushTimer()

    // 5. 页面关闭/后台切出时使用 sendBeacon 冲刷剩余队列
    this.bindUnloadEvents()
  }

  /**
   * 手动记录 API 性能指标（供 axios 拦截器等使用）
   */
  public trackApi(endpoint: string, method: string, durationMs: number, status: number): void {
    if (!this.enabled) return

    // 过滤上报端点自身，避免递归
    if (endpoint.includes('/telemetry/report')) {
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

  private push(item: TelemetryItem): void {
    this.queue.push(item)

    // 超过 100 条时丢弃最旧数据，避免极端网络环境内存堆积
    if (this.queue.length > 100) {
      this.queue.splice(0, this.queue.length - 100)
    }

    if (this.queue.length >= this.batchSize) {
      this.flush()
    }
  }

  public flush(): void {
    if (this.queue.length === 0 || !this.enabled) {
      return
    }

    const payload = this.queue.splice(0, 50)
    const body = JSON.stringify({ items: payload })

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' })
        const sent = navigator.sendBeacon(this.endpointUrl, blob)
        if (sent) return
      }

      // 回退使用原生 fetch
      window.fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // 静默丢弃失败，不影响前端主线程
      })
    } catch {
      // 容错防崩
    }
  }

  private startFlushTimer(): void {
    if (typeof window === 'undefined') return
    this.timer = window.setInterval(() => {
      this.flush()
    }, this.flushIntervalMs) as unknown as number
  }

  private bindUnloadEvents(): void {
    if (typeof document === 'undefined') return

    const onHidden = () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    }

    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', () => this.flush())
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
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            lcpValue = Math.round(lastEntry.startTime)
          }
        }
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // 页面隐藏时固化最终 LCP
      const commitLcp = () => {
        if (lcpValue > 0) {
          const rating = lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor'
          this.push({
            type: 'web_vitals',
            name: 'LCP',
            value: lcpValue,
            rating,
            timestamp: Math.floor(Date.now() / 1000),
          })
          lcpValue = 0
        }
      }
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') commitLcp()
      }, { once: true })
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
          }
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })

      const commitCls = () => {
        const val = Math.round(clsValue * 1000) / 1000
        const rating = val < 0.1 ? 'good' : val < 0.25 ? 'needs-improvement' : 'poor'
        this.push({
          type: 'web_vitals',
          name: 'CLS',
          value: val,
          rating,
          timestamp: Math.floor(Date.now() / 1000),
        })
      }
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') commitCls()
      }, { once: true })
    } catch {
      // 忽略
    }
  }

  private interceptFetch(): void {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
      return
    }

    const originalFetch = window.fetch
    const self = this

    window.fetch = async function (...args) {
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
        const response = await originalFetch.apply(this, args)
        status = response.status
        return response
      } catch (err) {
        status = 0
        throw err
      } finally {
        const duration = performance.now() - start
        if (url) {
          self.trackApi(url, method, duration, status)
        }
      }
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
