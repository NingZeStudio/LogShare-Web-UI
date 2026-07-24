# LogShare.CN Web UI — Agent Guide

LogShare.CN 是一个 Minecraft/Hytale 日志分享与分析前端，支持日志上传、AI 智能分析（SSE 流式）、Codex 在线解析、PWA 离线使用。

## 技术栈

| 层 | 技术 | 备注 |
|---|---|---|
| 框架 | Vue 3 (Composition API, `<script setup>`) | |
| 语言 | TypeScript 5 (strict) | 见 TS 配置细则 |
| 构建 | Vite 7 | 含自定义构建报告插件 |
| 路由 | Vue Router 4 (HTML5 History, 全部懒加载) | |
| HTTP | Axios 1 | 统一经由 `src/lib/ApiClient.ts` |
| 样式 | Tailwind CSS 3 (class 暗色模式, HSL CSS 变量) | dark 模式通过 `<html class="dark">` 切换 |
| 组件 | Radix Vue (来自 radix-vue) | UI 基础组件 |
| 图标 | lucide-vue-next | |
| Markdown | markdown-it | AI 分析结果渲染 |
| 压缩包 | JSZip | 浏览器端 ZIP 解析 |
| 代码质量 | ESLint 10 + Prettier 3 | |
| 包管理 | npm 11.12.1 | `package-lock.json` 锁定 |

## 目录结构

```
public/                静态资源
├── sw.js              Service Worker（PWA 离线缓存/更新检测）
├── manifest.json      PWA 清单
├── sdk/               多语言 SDK（JS/PHP/Java/.NET）
├── images/tutorials/  教程插图
├── img/               其他图片（favicon, banner）
├── sitemap.xml, robots.txt
src/
├── main.ts            应用入口
├── App.vue            根组件（顶栏/页脚/PWA/公告/主题设置）
├── router/index.ts    路由配置（硬编码，7 条路由）
├── views/             页面组件（7 个）
│   ├── HomeView.vue        首页（上传/拖拽/粘贴日志）
│   ├── LogView.vue         日志查看页（最复杂）
│   ├── ApiDocsView.vue     API 文档（含代码示例/SDK）
│   ├── SponsorView.vue     赞助页面
│   ├── TutorialsView.vue   教程列表
│   ├── TutorialArticleView.vue  教程详情
│   └── NotFoundView.vue    404 页面
├── components/        公共组件
│   ├── ThemeSettings.vue        主题/字体/显示模式侧栏
│   ├── AnnouncementDialog.vue   公告弹窗
│   ├── LanguageMenu.vue         语言切换下拉
│   ├── MobileNav.vue            移动端导航菜单
│   ├── PwaInstallPrompt.vue     PWA 安装提示条
│   ├── PwaUpdateToast.vue       PWA 更新通知条
│   └── ui/
│       └── DotBackground.vue    Canvas 动态点阵背景
├── composables/       可组合函数
│   ├── useAiAnalysis.ts         AI 分析（SSE 流式调用）
│   ├── useLogViewer.ts          日志查看器核心逻辑
│   └── useLogSearch.ts          日志搜索逻辑
├── lib/               工具库
│   ├── ApiClient.ts             API 客户端（所有后端请求）
│   ├── i18n.ts                  国际化运行时
│   ├── i18nConfig.ts            国际化文案（zh-CN / zh-TW）
│   ├── logParser.ts             日志解析器（输出 HTML）
│   ├── logViewUtils.ts          日志查看工具函数（旧版）
│   ├── archiveParser.ts         压缩包解析（ZIP）
│   ├── pageTitle.ts             页面标题管理
│   ├── announcementConfig.ts    公告配置与已读状态
│   ├── apiDocsUtils.ts          API 文档数据与代码示例
│   └── localStorage.ts          localStorage 工具（AI 记录）
├── data/
│   └── sponsors.ts              赞助者数据
└── assets/
    ├── index.css                全局样式 + Tailwind + CSS 变量
    ├── LogsAnalysis.css          日志渲染样式
    ├── fonts/                    woff2 自托管字体
    └── img/                      Logo / 收款码
```

## 构建与运行命令

```bash
npm install           # 安装依赖
npm run dev           # 启动 Vite 开发服务器
npm run build         # 先 vue-tsc -b 类型检查，再 vite build（唯一内置类型检查）
npm run preview       # 预览 dist/ 构建结果
npm run lint          # ESLint 自动修复 .vue/.js/.ts 等
npm run format        # Prettier 全仓库格式化
```

- **没有测试框架或单测脚本**。验证改动通常用 `npm run build`，需要风格检查时另跑 `npm run lint`。
- `build` 不会自动 lint，但 `vue-tsc` 的 TS 错误会让 build 失败。

## 配置详解

### TypeScript (`tsconfig.app.json`)

- 继承 `@vue/tsconfig/tsconfig.dom.json`
- `strict: true`、`noUnusedLocals: true`、`noUnusedParameters: true`
- `erasableSyntaxOnly: true` — **不要用 TypeScript `enum` / `namespace`**，类型导入用 `import type`
- `noUncheckedSideEffectImports: true`
- `@` 路径别名映射到 `src/`
- 类型文件见 `src/**/*.ts`, `src/**/*.vue`

### ESLint (`eslint.config.js`)

- Flat config，忽略 `node_modules/`, `dist/`, `public/`, `package-lock.json`
- unused vars / `no-explicit-any` / `vue/no-v-html` 均为 warn
- `vue/multi-word-component-names: off`

### Prettier (`.prettierrc`)

- 无分号、单引号、行宽 100、2 空格
- `trailingComma: none`、`arrowParens: avoid`、LF 换行

### Tailwind (`tailwind.config.js`)

- `darkMode: 'class'` — 通过 HTML 类切换暗色模式
- 颜色全部使用 HSL CSS 变量（如 `hsl(var(--primary))`）
- 字体通过 `--font-sans` / `--font-mono` CSS 变量控制

### Vite (`vite.config.ts`)

- 插件：`@vitejs/plugin-vue` + 自定义构建报告插件（构建结束时扫描 `dist/` 打印统计）
- 手动分包：`markdown` / `vue-core` / `axios` / `ui-components` / `utils` / `vendor`
- `chunkSizeWarningLimit: 500 KB`
- `@` 路径别名

## 入口与路由

### `src/main.ts`

- 导入 `index.css`，创建 Vue app，注册 router，挂载到 `#app`
- `load` 事件后注册 `/sw.js`（Service Worker），监听 `updatefound` 通过 `BroadcastChannel('pwa-update')` 和 `pwa-update-available` 自定义事件通知更新

### 路由 (`src/router/index.ts`)

**7 条路由全部懒加载：**

| 路径 | 名称 | 视图 | 说明 |
|---|---|---|---|
| `/` | home | HomeView | 首页 |
| `/api-docs` | api-docs | ApiDocsView | API 文档 |
| `/sponsor` | sponsor | SponsorView | 赞助 |
| `/tutorials` | tutorials | TutorialsView | 教程列表 |
| `/tutorials/:id` | tutorial-article | TutorialArticleView | 教程详情 |
| `/:id` | log | LogView | 日志查看（含信息页） |
| `/:pathMatch(.*)*` | not-found | NotFoundView | 404 |

**注意事项：**
- 路由硬编码，**新增/改名路由时**需同步检查：
  - `src/App.vue` 导航（`navLinks` 数组）
  - `src/components/MobileNav.vue` 移动端导航
  - `src/lib/pageTitle.ts` 标题模板和 `getCurrentPageTemplate()` 的 switch
- `/:id` 路由排在最后，它会捕获所有单段路径；`/api-docs` 等具名路由必须放在前面
- `router.beforeEach` 中根据 `meta.title` 设置页面标题

## API 层

- 统一封装在 `src/lib/ApiClient.ts`，`baseURL` 硬编码为 `https://api.logshare.cn`
- 实例 `apiClient` 为单例，暴露 CRUD 方法及 SSE 流式方法
- 所有后端接口说明在 `API.md`，不要凭端点名猜请求/响应结构
- `response` 拦截器记录错误日志

### AI 分析（SSE 流式）

- `streamAiAnalysis(id, callbacks)` — 基于已存储日志（`GET /1/ai/{id}`）
- `streamAiAnalyseByContent(content, callbacks)` — 直接提交内容（`POST /1/ai/analyse`）
- 使用原生 `fetch`（非 Axios）处理 SSE 流，OpenAI 兼容格式（`choices[0].delta.content`）

## 日志渲染

- `src/lib/logParser.ts` 直接输出 HTML 字符串（不是 Vue 组件）
- 行号按需显示，错误/警告行自动分组
- Minecraft `§` 颜色码映射在 `formatContent()` 的 `styleMap` 中
- **修改颜色映射时**必须同步更新 `src/assets/LogsAnalysis.css` 中的 CSS 类名（如 `.format-red`, `.format-bold` 等）
- 堆栈跟踪有专门的 CSS 类（`.level-stack-frame`, `.level-stack-class` 等）

## 国际化（i18n）

- **自定义实现**，非 vue-i18n
- 文案：`src/lib/i18nConfig.ts`（`zhCN` / `zhTW` 两个对象）
- 运行时：`src/lib/i18n.ts`，`t(key)` 翻译函数
- 语言存在 `localStorage.preferred_language`
- 当前切换语言后**通过刷新页面生效**

## 主题系统

- 暗色模式：`class` 策略，`<html class="dark">`
- 6 种主题色：靛蓝(indigo)、翡翠(emerald)、玫瑰(rose)、琥珀(amber)、紫罗兰(violet)、石墨(slate)
- 2 种字体：Maple Mono、Fira Code（自托管 woff2）
- 3 种显示模式：亮色/暗色/跟随系统
- 所有设置持久化到 `localStorage`
- 主题色通过 HSL CSS 变量在运行时动态切换

## PWA 更新链路

涉及 3 个文件，修改任何一处都需验证更新提示流程：

1. `public/sw.js` — Service Worker，缓存名 `logshare-v1.5.0`
2. `src/main.ts` — SW 注册 + 更新检测 + 事件分发
3. `src/components/PwaUpdateToast.vue` — UI 提示条

通信方式：
- `BroadcastChannel('pwa-update')` — SW 和主线程之间
- `window.dispatchEvent(new CustomEvent('pwa-update-available'))` — Vue 组件监听

修改 SW 或缓存名时，确保更新提示仍能正常工作。

## 公告系统

- 配置：`src/lib/announcementConfig.ts`，`announcementConfig` 对象
- 修改 `announcementConfig.id` 会让用户重新看到公告
- 公告默认包含「加入官方QQ群」和「赞助支持我们」两个入口（`links` 数组），修改/重写公告时**不要删除**
- 已读状态持久化在 `localStorage`

## 数据流与关键逻辑

### 首页 (HomeView)
- 粘贴文本 + 拖拽文件 + 文件选择器
- 支持 `.zip` 压缩包解析（浏览端用 JSZip）
- 单文件直接上传跳转，多文件批量上传展示链接
- 上传日志时保存 `token` 到 `localStorage`（用于后续删除）

### 日志页 (LogView)
- 并行请求 `GET /1/raw/{id}` + `GET /1/insights/{id}`
- 使用 `useLogViewer` composable 管理状态
- 使用 `useAiAnalysis` composable 管理 AI 分析（SSE 流式）
- 使用 `useLogSearch` composable 管理搜索
- 支持：行号、错误高亮、全屏、字体调节、复制分享、下载、删除
- AI 分析结果用 markdown-it 渲染

### API 文档页 (ApiDocsView)
- 展示所有端点的请求/响应格式
- 提供 JS / PHP / cURL 代码示例
- 列出 SDK 下载链接

## 安全与隐私

- 敏感信息脱敏由后端在 `/1/filters` 配置正则规则（IPv4、IPv6、用户名、AccessToken）
- 前端日志渲染不涉及额外脱敏逻辑
- 删除日志需 `Authorization: Bearer <token>`，token 来自上传响应
- `withCredentials: false` — 不发送跨站凭据

## 部署

- `.cnb.yml`：在 `main` 分支推送时，将当前 HEAD force push 到 GitHub 镜像仓库 `NingZeStudio/McLogs-Next-UI`
- **不要把它当普通 CI 测试流水线**

## 代码注意事项

1. 不要用 TypeScript `enum` / `namespace`，类型导入用 `import type`
2. 路由修改涉及 4 个文件：`router/index.ts`、`App.vue`、`MobileNav.vue`、`pageTitle.ts`
3. 日志解析和颜色码映射是"已知屎山"（代码注释中已标注），扩展新格式需改对应的解析函数和 CSS
4. ZIP 解析在浏览器端进行，大文件可能导致内存问题
5. `apiDocsUtils.ts` 中的代码示例硬编码，更新 API 时需同步更新
6. 教程数据（`TutorialArticleView.vue`）硬编码在视图文件中，扩展性差
7. 赞助者数据在 `src/data/sponsors.ts` 中硬编码
8. 公共 `sw.js` 不会被 ESLint 检查和修复
9. 字体文件为自托管 woff2（Maple Mono + Fira Code），使用 `font-display: swap`
10. 所有工具告警/提示均使用自定义通知组件，非浏览器原生 alert/confirm

## 许可

MIT License — Copyright (c) 2024 LogShare.CN Team
