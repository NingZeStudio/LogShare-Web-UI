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
  id: '20250515_iqge_cc_launch',
  title: 'IQge Control Converter 现已上线！',
  content:
    'NingZeStudio & IQge 全新力作，IQge Control Converter 现已上线！当前最先进的控件转换算法，支持 ZalithLauncher2 控件与 FoldCraftLauncher 控件无损转换，再复杂的键位也能双启动器通用，零样式损坏，使用更安心。\n\n项目由 NingZeStudio 发行，是 NingZeStudio 全新力作，业内首个实现无损转换的算法，旨在打破启动器间的控件壁垒；IQge 版权所有。',
  links: [
    {
      label: '在线使用',
      url: 'https://cc.miawa.cn/',
      icon: 'ExternalLink',
      color: 'blue'
    },
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
  importantText: '业内首个实现无损转换的算法，打破启动器间的控件壁垒！'
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
