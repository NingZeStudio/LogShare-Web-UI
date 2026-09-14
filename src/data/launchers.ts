export interface LauncherItem {
  id: string
  name: string
  shortName: string
  slogan: string
  description: string
  platform: string[]
  website: string
  github: string
  integration: string
  tags: string[]
  featured?: boolean
}

export const integratedLaunchers: LauncherItem[] = [
  {
    id: 'fcl',
    name: 'Fold Craft Launcher',
    shortName: 'FCL',
    slogan: '全功能 Android 端 Minecraft: Java 版开源启动器',
    description:
      '国内最主流、生态最繁荣的 Android Minecraft 启动器之一。具备强大的触控映射、渲染器插件化架构、EasyTier 联机与 Terracotta 内嵌组网能力。',
    platform: ['Android'],
    website: 'https://foldcraftlauncher.cn',
    github: 'https://github.com/FCL-Team/FoldCraftLauncher',
    integration: '原生集成 LogShare API，客户端报错与日志界面提供一键上传脱敏分享功能。',
    tags: ['开源标杆', 'Kotlin', '渲染器插件', '深度集成'],
    featured: true
  },
  {
    id: 'zl2',
    name: 'Zalith Launcher2',
    shortName: 'ZL2',
    slogan: '现代美学与极致性能的 Android Minecraft 启动器',
    description:
      '采用现代 Material You 设计语言的高性能移动端启动器。拥有极其细腻的操作手感、多版本隔离管理以及全方位的渲染后端与自定义控制器支持。',
    platform: ['Android'],
    website: 'https://zalithlauncher.cn',
    github: 'https://github.com/ZalithLauncher/ZalithLauncher2',
    integration:
      '内置 MirroredAPI 原生对接，游戏崩溃时自动提示一键提交至 LogShare 并获取排查诊断。',
    tags: ['Material You', '高性能', '现代交互', '深度集成'],
    featured: true
  },
  {
    id: 'axolotl',
    name: 'Axolotl Launcher',
    shortName: 'Axolotl',
    slogan: '美西螈启动器：轻量极致、纯 Rust 协议驱动的跨平台启动器',
    description:
      '基于纯 Rust 高性能协议栈 AxolotlPackets 与现代化 Angular 前端打造的新一代跨平台启动器。内存占用极低，下载与游戏启动极速响应。',
    platform: ['Windows', 'macOS', 'Linux'],
    website: 'https://axlmc.org',
    github: 'https://github.com/Mystic-Stars/Axolotl',
    integration:
      '底层基于 Rust 原生集成 LogShare API，UI 视口直接复用 LogShare 虚拟化高亮渲染引擎。',
    tags: ['Rust 核心', '跨平台', '极速启动', '虚拟高亮'],
    featured: true
  },
  {
    id: 'pilauncher',
    name: 'PiLauncher',
    shortName: 'PiLauncher',
    slogan: '专为 SteamDeck 及掌机设备打造的现代化跨平台启动器',
    description:
      '基于 Tauri + React + Framer Motion 构建。专为掌机屏幕与手柄操作深度定制，同时完美兼顾键鼠交互，带来优雅丝滑的主机级操作体验。',
    platform: ['SteamOS', 'Linux', 'Windows'],
    website: 'https://pil.nav4ai.net/',
    github: 'https://github.com/MrShellad/pilauncher',
    integration: '通过内置 useLogShare 模块实现游戏控制台日志一键上传至 LogShare.CN 分享排错。',
    tags: ['SteamDeck 专属', 'Tauri', '手柄适配', '流畅动效'],
    featured: true
  },
  {
    id: 'amcl',
    name: 'AxeMinecraftLauncher',
    shortName: 'AMCL',
    slogan: '全球首款鸿蒙 (HarmonyOS NEXT) 原生全量 Java 版启动器',
    description:
      '专为 HarmonyOS NEXT 纯血鸿蒙生态打造的 Minecraft: Java 版启动器。填补了纯血鸿蒙设备运行全量 Java 版游戏的生态空白，具备极高技术突破性。',
    platform: ['HarmonyOS NEXT'],
    website: 'https://amcl.lovedhy.cn/',
    github: 'https://github.com/LZZLHY/amcl',
    integration: '全面接入 LogShare 日志上报与分析体系，鸿蒙玩家可一键生成链接提交技术互助。',
    tags: ['鸿蒙原生', 'ArkTS', '纯血鸿蒙', '技术首创'],
    featured: true
  }
]
