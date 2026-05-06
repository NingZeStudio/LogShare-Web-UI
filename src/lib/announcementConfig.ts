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
  id: '20250506_loganalysis_minimax_m2.5',
  title: '全新LogAnalysis智能分析系统上线',
  content:
    '基于MiniMax M2.5模型的全新LogAnalysis智能分析系统现已上线！网页版可直接在日志详情界面体验，同时提供两种API端点：通过日志ID分析（GET /1/ai/{id}）或POST不落盘分析（POST /1/ai/analyse），助力快速定位日志问题。',
  links: [
    {
      label: '加入官方QQ群',
      url: 'https://qm.qq.com/q/FOGt99aayY',
      icon: 'Users',
      color: 'blue'
    },
    {
      label: 'API文档',
      url: '/api-docs',
      icon: 'FileCode',
      color: 'purple'
    },
    {
      label: '赞助支持我们',
      url: '/sponsor',
      icon: 'Heart',
      color: 'red'
    }
  ],
  importantText: '欢迎加入LogShare官方QQ群（点击下方链接），与开发者和其他用户交流使用经验，获取最新更新通知！'
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
  const lastSeen = localStorage.getItem(localStorageKeys.lastAnnouncementId)
  const currentId = announcementConfig.id
  return (
    lastSeen === currentId && localStorage.getItem(localStorageKeys.announcementShown) === 'true'
  )
}

export function markAnnouncementAsSeen(): void {
  localStorage.setItem(localStorageKeys.announcementShown, 'true')
  localStorage.setItem(localStorageKeys.lastAnnouncementId, announcementConfig.id)
}

export function hasSeenLogUpdate(logId: string): boolean {
  return localStorage.getItem(getLogUpdateShownKey(logId)) === 'true'
}

export function markLogUpdateAsSeen(logId: string): void {
  localStorage.setItem(getLogUpdateShownKey(logId), 'true')
}

export function resetAnnouncement(): void {
  localStorage.removeItem(localStorageKeys.announcementShown)
  localStorage.removeItem(localStorageKeys.lastAnnouncementId)
}

export function resetLogUpdate(logId: string): void {
  localStorage.removeItem(getLogUpdateShownKey(logId))
}
