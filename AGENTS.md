# LogShare Web UI — Agent Guide

LogShare.CN 前端，Minecraft/Hytale 日志分享与分析平台。基于 Vue 3 + TypeScript + Vite 7 + Tailwind CSS 3。

## Essential Commands

```bash
npm run dev        # 开发服务器 (vite)
npm run build      # 生产构建 (vue-tsc -b && vite build)
npm run preview    # 预览构建产物 (vite preview)
npm run lint       # ESLint 检查并自动修复 (.vue,.js,.ts,.tsx)
npm run format     # Prettier 格式化全部文件
```

## Architecture

### Entry Points

- **App 入口**: `src/main.ts` — 创建 Vue 应用，注册 router，挂载；同时注册 Service Worker（PWA 更新通过 `BroadcastChannel('pwa-update')` 通信）
- **路由**: `src/router/index.ts` — 所有路由懒加载（`import()`），硬编码，修改路由需同步更新 `App.vue` 中的导航链接和 `src/lib/pageTitle.ts` 中的 switch/templates
- **API 客户端**: `src/lib/ApiClient.ts` — 基于 axios，硬编码 baseURL `https://api.logshare.cn:4`，包含 SSE 流式 AI 分析
- **i18n**: `src/lib/i18n.ts` + `src/lib/i18nConfig.ts` — 自定义实现（非 vue-i18n），支持 zh-CN/ZH-TW，检测 localStorage `preferred_language` → navigator.language 回退

### Directory Layout

| 目录 | 用途 |
|---|---|
| `src/views/` | 页面组件 (7 个：Home, LogView, ApiDocs, Tutorials, TutorialArticle, Sponsor, NotFound) |
| `src/components/` | 可复用组件（PwaUpdateToast, PwaInstallPrompt, ThemeSettings, LanguageMenu, MobileNav 等） |
| `src/lib/` | 工具：logParser, pageTitle, ApiClient, i18n, i18nConfig |
| `src/data/` | 静态数据（赞助商等） |
| `src/assets/fonts/` | 自托管 Maple Mono / Fira Code woff2 |
| `public/` | Service Worker `sw.js`, manifest |

## Conventions & Gotchas

### TypeScript
- Strict mode, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **`erasableSyntaxOnly: true`** — 不能使用 `enum` / `namespace`；type-only import 必须用 `import type`（`tsconfig.app.json:15`）
- 类型错误会导致构建失败（`build` 命令内含 `vue-tsc -b`）

### Linting & Formatting
- ESLint 10 flat config（`eslint.config.js`）— 分 `*.ts/tsx` 和 `*.vue` 两套规则
- Prettier（`.prettierrc`）: `semi: false`, `singleQuote: true`, `trailingComma: "none"`, `arrowParens: "avoid"`, `printWidth: 100`
- `build` 前 **不会** 自动 lint，需手动运行 `npm run lint`

### Tailwind
- Dark mode: `class` 策略（手动切换 class="dark"）
- 颜色系统：HSL CSS 变量 (如 `hsl(var(--primary))`)
- `@tailwindcss/typography` 插件已配置

### Log Parser
- `src/lib/logParser.ts` — 解析逻辑和 Minecraft 颜色代码映射硬编码；扩展新日志格式需修改 `parseLog()` / `formatContent()`；颜色 CSS class 与 `formatContent()` 中 `styleMap` 同步

### PWA
- `public/sw.js` — 网络优先策略，缓存同源静态资源
- `src/main.ts:13-58` — SW 注册 + 更新检测，通过 `BroadcastChannel('pwa-update')` 向 `PwaUpdateToast` 组件发 `UPDATE_AVAILABLE` 事件
- 修改 SW 后需整条链路验证

### Vite Build
- 自定义构建报告插件（`vite.config.ts:74-226`）构建后输出详细文件统计
- 代码分割策略：markdown, vue-core, axios, ui-components (radix-vue + lucide), utils (cva + clsx + tailwind-merge), vendor
- `chunkSizeWarningLimit: 500` (KB) — `vite.config.ts:264`

### CI
- `.cnb.yml` — 当 push 时镜像同步到 GitHub

### API
后端 API 文档见 `API.md`。关键端点：
- `POST /1/log` — 提交日志
- `GET /1/raw/{id}` — 原始日志
- `GET /1/insights/{id}` — 日志洞察
- `GET /1/ai/{id}` — AI 分析（已弃用，用 SSE 流替代）
- `DELETE /1/delete/{id}` — 删除（需 Token）
- `GET /1/limits` — 限制信息
- `GET /1/filters` — 过滤器配置

> 项目无测试框架。
