export interface Sponsor {
  id: number
  name: string
  avatar?: string
  amount: number
  currency: 'CNY' | 'USD'
  date: string
  message?: string
  platform: 'alipay' | 'wechat' | 'afdian' | 'anonymous'
}

export interface SponsorConfig {
  afdianLink?: string
  alipayQrCode?: string
  wechatQrCode?: string
  title: string
  description: string
  goal?: number
  current?: number
}

export const sponsorConfig: SponsorConfig = {
  title: '赞助我们',
  description: '您的支持是我们前进的动力，所有赞助将用于服务器、API 调用和其他基础设施支出。',
  goal: 200,
  current: 0,
  afdianLink: 'https://afdian.com/a/your-id',
  alipayQrCode: new URL('@/assets/img/支付宝.jpg', import.meta.url).href,
  wechatQrCode: new URL('@/assets/img/微信.png', import.meta.url).href,
}

export const sponsors: Sponsor[] = [
  {
    id: 1,
    name: 'ksgf452',
    amount: 40,
    currency: 'CNY',
    date: '2026-03-08',
    platform: 'alipay'
  },
  {
    id: 2,
    name: '@习习中',
    amount: 34,
    currency: 'CNY',
    date: '2026-03-08',
    platform: 'wechat'
  },
  {
    id: 3,
    name: '@WZW_王宗王',
    amount: 50,
    currency: 'CNY',
    date: '2026-03-22',
    platform: 'wechat',
    message: 'Bilibili UP 主 UID: 504274118'
  }
]

export function getTotalAmount(): number {
  return sponsors.reduce((sum, sponsor) => sum + sponsor.amount, 0)
}

export function getSponsorCount(): number {
  return sponsors.length
}

export function getPlatformIcon(platform: Sponsor['platform']): string {
  switch (platform) {
    case 'alipay':
      return 'Alipay'
    case 'wechat':
      return 'WeChat'
    case 'afdian':
      return '爱发电'
    default:
      return '匿名'
  }
}

export function getPlatformColor(platform: Sponsor['platform']): string {
  switch (platform) {
    case 'alipay':
      return 'text-blue-500 bg-blue-500/10'
    case 'wechat':
      return 'text-green-500 bg-green-500/10'
    case 'afdian':
      return 'text-purple-500 bg-purple-500/10'
    default:
      return 'text-gray-500 bg-gray-500/10'
  }
}
