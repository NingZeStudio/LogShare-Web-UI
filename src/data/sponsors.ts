/**
 * 赞助者数据模块
 * 可以在这里添加赞助者信息
 */

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

/**
 * 赞助配置
 */
export const sponsorConfig: SponsorConfig = {
  title: '赞助我们',
  description: '您的支持是我们前进的动力，所有赞助将用于服务器、API 调用和其他基础设施支出。',
  goal: 200,
  current: 0,
  // 爱发电链接
  afdianLink: 'https://afdian.com/a/your-id',
  // 支付宝二维码图片路径 (放在 public/img/ 目录下)
  alipayQrCode: '/img/qrcode/alipay.png',
  // 微信二维码图片路径 (放在 public/img/ 目录下)
  wechatQrCode: '/img/qrcode/wechat.png'
}

/**
 * 赞助者列表
 * 手动添加赞助者信息
 */
export const sponsors: Sponsor[] = [
  // 示例数据，请替换为真实的赞助者信息
  {
    id: 1,
    name: '热心用户',
    amount: 50,
    currency: 'CNY',
    date: '2025-01-15',
    message: '项目很棒，继续加油！',
    platform: 'alipay'
  },
  {
    id: 2,
    name: '匿名用户',
    amount: 20,
    currency: 'CNY',
    date: '2025-01-10',
    platform: 'wechat'
  },
  {
    id: 3,
    name: 'Minecraft 爱好者',
    amount: 100,
    currency: 'CNY',
    date: '2025-01-05',
    message: '感谢你们提供的服务',
    platform: 'afdian'
  }
]

/**
 * 获取赞助总额
 */
export function getTotalAmount(): number {
  return sponsors.reduce((sum, sponsor) => sum + sponsor.amount, 0)
}

/**
 * 获取赞助者数量
 */
export function getSponsorCount(): number {
  return sponsors.length
}

/**
 * 获取平台图标
 */
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

/**
 * 获取平台颜色
 */
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
