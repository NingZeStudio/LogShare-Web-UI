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
  id: '20250418_ddos',
  title: '最新公告',
  content: `4月17日到18日，我们被DDoS攻击了，服务瘫了将近23小时。

说实话，我们不知道是谁、也不知道为什么。我们只是个很小的项目，服务器配置也很差，扛不住这种攻击，只能硬撑。我们也没能力去追查或者反击，除了忍着，真的什么都做不了。

但我想说：如果你对我们有意见，能不能直接找我们？哪怕骂我一顿也行。别拿服务撒气，上面还有很多普通用户在用。算我求你们了。`,
  links: [
    {
      label: '加入官方 QQ 群',
      url: 'https://qm.qq.com/q/RNnWR2HhOS',
      icon: 'MessageCircle',
      color: 'blue'
    },
    {
      label: '赞助支持我们',
      url: '/sponsor',
      icon: 'Heart',
      color: 'red'
    }
  ],
  importantText: '算我求你们了'
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
