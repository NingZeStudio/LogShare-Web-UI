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
  id: '20260624_service_stable',
  title: 'LogShare.CN 持续稳定运营中',
  content:
    '感谢大家一直以来对 LogShare 的支持与信任。目前各项服务均正常稳定运行，我们也会持续维护和优化。\n\n推荐访问我们的教程中心，涵盖了 Minecraft 基础概念扫盲、渲染器配置、提问技巧等实用内容，帮助你更快地自行排查问题。\n\n如有任何重要更新或变更，我们会在官方QQ群中提前告知，敬请留意。祝各位游戏愉快！',
  links: [
    {
      label: '加入官方QQ群',
      url: 'https://qm.qq.com/q/FOGt99aayY',
      icon: 'Users',
      color: 'blue'
    },
    {
      label: '赞助支持我们',
      url: '/sponsor',
      icon: 'Heart',
      color: 'red'
    }
  ],
  importantText: '教程中心已上线，点击导航栏「教程」查看。'
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
