# LogShare.CN

Minecraft / Hytale 日志分享与分析前端。支持日志上传、AI 智能分析、Codex 在线解析、PWA 离线使用。

## 功能特性

- **日志上传与分享** — 粘贴文本、拖拽文件、上传压缩包，生成分享链接
- **AI 智能分析** — 基于 SSE 流式输出的 LLM 分析，支持已存储日志和直接内容分析（隐私保护场景）
- **日志查看器** — 行号显示、错误/警告高亮、Minecraft `§` 颜色码渲染、搜索、全屏、字体大小调节
- **Codex 在线分析** — 基于 Aternos Codex 的本地解析，自动检测服务端类型、崩溃原因
- **多文件批量处理** — 支持压缩包解析并批量上传多个日志文件
- **敏感信息脱敏** — 自动过滤 IPv4、IPv6、用户名、AccessToken 等隐私信息
- **PWA 支持** — 可安装到桌面，Service Worker 离线缓存，自动更新检测
- **深色模式** — 支持明暗主题切换，跟随系统偏好
- **国际化** — 简体中文 / 繁體中文
- **API 文档** — 内置交互式 API 文档，提供 JS / PHP / cURL 示例及 SDK 下载

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vue 3（Composition API, `<script setup>`） |
| 语言 | TypeScript 5（strict） |
| 构建 | Vite 7 |
| 路由 | Vue Router 4（懒加载，HTML5 History） |
| HTTP | Axios 1 |
| 样式 | Tailwind CSS 3（class 暗色模式，HSL 变量） |
| 组件 | Radix Vue |
| 图标 | lucide-vue-next |
| 代码质量 | ESLint 10 + Prettier 3（无分号、单引号、行宽 100） |
| 包管理 | npm 11.12.1 |

## 快速开始

```bash
npm install           # 安装依赖
npm run dev           # 启动开发服务器
npm run build         # 构建生产版本（含类型检查）
npm run preview       # 预览构建结果
npm run lint          # 代码检查
npm run format        # 代码格式化
```

## 项目结构

```
public/               静态资源
├── sw.js             Service Worker
├── manifest.json     PWA 清单
└── ...
src/
├── main.ts           应用入口
├── App.vue           根组件
├── router/index.ts   路由配置
├── views/            页面组件
├── components/       公共组件
├── lib/              工具库
│   ├── ApiClient.ts  API 客户端
│   ├── i18n.ts       国际化运行时
│   ├── i18nConfig.ts 国际化文案
│   ├── logParser.ts  日志解析器
│   └── pageTitle.ts  页面标题管理
└── assets/           静态资源
API.md                后端 API 文档
AGENTS.md             AI Agent 上下文指南
CHANGELOG.md          更新日志
```

完整项目结构见 [src/ 目录](./src/)。

## 相关项目

- [LogShare](https://github.com/NingZeStudio/LogShare) — 后端 API（PHP）

## 许可

MIT
