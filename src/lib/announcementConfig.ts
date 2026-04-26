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
  id: '20250426_sponsor_swung',
  title: '最新公告',
  content: '感谢所有对Lemwood旗下镜像、工具站、LogShare项目的捐助',
  links: [
    {
      label: '赞助支持我们',
      url: '/sponsor',
      icon: 'Heart',
      color: 'red'
    }
  ],
  importantText: '感谢来自MobileGlues开发者Swung 0x48的1000元人民币赞助支持！！\n感谢Bilibili UP主 ConfectionaryQwQ 对本项目的大力宣传支持'
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
  return lastSeen === currentId && localStorage.getItem(localStorageKeys.announcementShown) === 'true'
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
