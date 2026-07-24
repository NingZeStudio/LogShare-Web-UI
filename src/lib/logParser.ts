/**
 * 日志解析引擎 — 异步 Web Worker 桥接层
 *
 * 所有解析逻辑在 Web Worker 中执行，不阻塞主线程。
 * 维持与旧版同步 parseLog() 相同的签名（现返回 Promise<string>）。
 */

type ParseMessage = { type: 'parse'; raw: string; showLineNumbers: boolean }
type ResultMessage = { type: 'result'; html: string }
type ErrorMessage = { type: 'error'; error: string }

let worker: Worker | null = null
let pending: {
  resolve: (html: string) => void
  reject: (err: Error) => void
} | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./logParser.worker.ts', import.meta.url), { type: 'module' })

    worker.onmessage = (e: MessageEvent<ResultMessage | ErrorMessage>) => {
      const data = e.data
      if (data.type === 'result') {
        pending?.resolve(data.html)
      } else if (data.type === 'error') {
        pending?.reject(new Error(data.error))
      }
      pending = null
    }

    worker.onerror = (err: ErrorEvent) => {
      pending?.reject(new Error(err.message || 'Unknown worker error'))
      pending = null
    }
  }
  return worker
}

/**
 * 将原始日志文本解析为 HTML
 * @param raw             原始日志内容
 * @param showLineNumbers 是否显示行号（默认 true）
 */
export function parseLog(raw: string, showLineNumbers: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    if (pending) {
      reject(new Error('Parse already in progress'))
      return
    }
    pending = { resolve, reject }
    const msg: ParseMessage = { type: 'parse', raw, showLineNumbers }
    getWorker().postMessage(msg)
  })
}
