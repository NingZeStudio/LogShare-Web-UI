export interface AnnouncementConfig {
  id: string
  title: string
  content: string
  links: Array<{
    label: string
    url: string
    icon: string
    color: string
  }>
  importantText?: string
}

export const announcementConfig: AnnouncementConfig = {
  id: '20260913_telemetry_terms_notice',
  title: 'LogShare 更新公告',
  content:
    '新版本已内置自研遥测SDK，用于采集 Core Web Vitals、API时延等性能数据，帮助我们优化访问速度与稳定性；相关《服务协议》和《隐私政策》已同步更新，请留意查看。\n\n继续使用即视为知悉，如不同意可停止使用，感谢支持～',
  links: [
    {
      label: '服务协议',
      url: 'https://logshare.cn/terms',
      icon: 'FileText',
      color: 'blue'
    },
    {
      label: '隐私政策',
      url: 'https://logshare.cn/privacy',
      icon: 'Shield',
      color: 'green'
    }
  ]
}

export interface LogUpdateConfig {
  logId: string
  title: string
  description: string
}

export const logUpdateConfigs: LogUpdateConfig[] = [
  {
    logId: 'example-log-id',
    title: '日志已更新',
    description: '您关注的日志有新的更新，点击查看详情。'
  }
]

export const localStorageKeys = {
  announcementShown: 'ann_shown_v2',
  logUpdateShown: 'log_upd_shown_',
  lastAnnouncementId: 'last_ann_id'
} as const

export function getLogUpdateShownKey(logId: string): string {
  return `${localStorageKeys.logUpdateShown}${logId}`
}

export function hasSeenAnnouncement(): boolean {
  if (typeof localStorage === 'undefined') return true
  const lastSeen = localStorage.getItem(localStorageKeys.lastAnnouncementId)
  const currentId = announcementConfig.id
  return (
    lastSeen === currentId && localStorage.getItem(localStorageKeys.announcementShown) === 'true'
  )
}

export function markAnnouncementAsSeen(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(localStorageKeys.announcementShown, 'true')
  localStorage.setItem(localStorageKeys.lastAnnouncementId, announcementConfig.id)
}

export function hasSeenLogUpdate(logId: string): boolean {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem(getLogUpdateShownKey(logId)) === 'true'
}

export function markLogUpdateAsSeen(logId: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(getLogUpdateShownKey(logId), 'true')
}

export function resetAnnouncement(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(localStorageKeys.announcementShown)
  localStorage.removeItem(localStorageKeys.lastAnnouncementId)
}

export function resetLogUpdate(logId: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(getLogUpdateShownKey(logId))
}
