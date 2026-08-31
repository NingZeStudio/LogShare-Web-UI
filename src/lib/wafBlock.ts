import { reactive } from 'vue'

/**
 * OpenLiteWaf 拦截卡片弹窗的全局单例状态。
 *
 * axios 拦截器与 SSE（fetch）路径都可能触发，无路由上下文，
 * 因此用模块级 reactive 而非 provide/inject。
 */
export const wafBlockState = reactive({
  open: false,
  html: ''
})

/**
 * 判定响应体是否为 OpenLiteWaf 拦截卡片。
 *
 * 业务 403（JSON，如删除令牌不匹配）不会命中；仅当响应体为
 * WAF 返回的 HTML 卡片（特征：class="widget"）时为 true。
 */
export const isWafBlockHtml = (data: unknown): boolean =>
  typeof data === 'string' && data.includes('class="widget"')

/** 弹出拦截卡片；重复触发时刷新内容 */
export const showWafBlock = (html: string): void => {
  wafBlockState.html = html
  wafBlockState.open = true
}

export const hideWafBlock = (): void => {
  wafBlockState.open = false
}
