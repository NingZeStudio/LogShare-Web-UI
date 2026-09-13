# LogShare.CN Web UI — Agent Guide

Vue 3 + TypeScript 5 + Vite 7 前端，Minecraft/Hytale 日志分享与分析平台。

## 开发环境

- **Termux/Android：** 使用 `nub run <script>` 替代 `npm run`（见 `~/.config/opencode/NUBDOC.md`）。运行 `.ts` 文件时，用 `node --experimental-strip-types` 或 `tsx`，`nub <file.ts>` 会报错。
- **无测试框架。** 验证改动只用 `npm run build`（含 `vue-tsc -b` 类型检查），风格检查另跑 `npm run lint`（含 `--fix`，会自动修改文件）。
- **不要主动构建。** 改完代码即停止；仅在用户明确要求时才运行 build/lint 验证。

## 编码约定

- **TypeScript：** `strict: true`，`noUnusedLocals`，`noUnusedParameters`。`erasableSyntaxOnly: true` — **禁止 `enum`/`namespace`**，类型导入用 `import type`。
- **代码格式：** Prettier（无分号、单引号、行宽 100、`trailingComma: none`、`arrowParens: avoid`、LF 换行）。ESLint flat config，`vue/no-v-html` / `no-explicit-any` / unused vars 均为 warn。
- **路径别名：** `@` 映射到 `src/`。
- **注释：** 仅用于标注已知技术债务（如"屎山"），不添加说明性注释。

## 关键约束与陷阱

### 路由修改（4 个文件）
修改路由时**必须同步更新**：
- `src/router/index.ts` — 路由定义
- `src/App.vue` — `navLinks` 导航数组
- `src/components/MobileNav.vue` — 移动端导航
- `src/lib/pageTitle.ts` — `pageTitleTemplates` 和 `getCurrentPageTemplate()` 的 switch

### PWA 更新链路（2 个文件）
涉及 `public/sw.js`、`src/main.ts`、`src/components/PwaUpdateToast.vue`。修改后必须验证：
- 唯一生效链路：main.ts `updatefound` → `window.dispatchEvent(new CustomEvent('pwa-update-available'))` → PwaUpdateToast 监听
- `public/sw.js` **不会被 ESLint 检查和修复**；缓存策略分三档（导航 network-first + 离线兜底、`/assets/` cache-first、其余同源 GET network-first）

### 日志解析与 CSS 耦合
`src/lib/logParser.ts` 通过 Web Worker 解析：`new Worker(new URL('./logParser.worker.ts', import.meta.url), { type: 'module' })`。真正的解析逻辑在 `logParser.worker.ts`，它输出 HTML 字符串（非 Vue 组件）。其 `COLOR_STYLE_MAP` 颜色映射必须与 `src/assets/LogsAnalysis.css` 中的 `.format-*` 类名保持同步。
### API 层

- 所有 HTTP 请求统一通过 `src/lib/ApiClient.ts`，`baseURL = 'https://api.logshare.cn'`（硬编码）。
- 后端已弃用 `/1/` 端点，前端统一使用 `/v1/` 路径（`/v1/log`、`/v1/log/{id}` 元信息、`/v1/raw/{id}`、`/v1/raw/{id}/{filename}` 附加文件、`/v1/insights/{id}`、`/v1/ai/{id}`、`/v1/ai/analyse`、`/v1/limits`、`/v1/filters`）。
- 错误响应字段为 `error`（非 `message`）；前端读取时保留 `error || message` 兜底。
- AI 分析 SSE：`data:` 为正文增量（OpenAI 兼容），LogAgent 模式额外输出 `event: status`（thinking/tool/tool_result/limit），`event: done` 结束；AI 关闭时返回 HTTP 404。解析逻辑集中在 `ApiClient.consumeSse()`。
- insights 响应为扁平结构（无 `success/data` 包装）：`title` + `analysis.problems/information`。
- 上游后端仓库位于 `~/LogShare/`，其 `API.md` 为权威文档；本仓库 `API.md` 为其副本，更新 API 时同步。
- `ApiDocsView.vue` 中的端点与代码示例硬编码，更新 API 时同步修改（`apiDocsUtils.ts` 已删除）。
- 无引用依赖已清理（radix-vue / cva / clsx / tailwind-merge）；新增 UI 依赖前先确认确有使用。

### i18n
- **自定义实现**，非 vue-i18n。文案在 `src/lib/i18nConfig.ts`（`zhCN`/`zhTW`），运行时用 `src/lib/i18n.ts` 的 `t(key)`。
- 语言切换后**必须刷新页面**才能生效（存在 `localStorage.preferred_language`）。

### 硬编码数据
- `src/views/ApiDocsView.vue` — API 端点与代码示例硬编码，更新 API 时同步修改。
- `src/views/TutorialArticleView.vue` — 教程数据硬编码在组件中。
- `src/data/sponsors.ts` — 赞助者数据硬编码。
- `src/lib/announcementConfig.ts` — 公告与日志更新提示硬编码。
- 版本号由 vite.config.ts 构建时从 package.json 注入（`__APP_VERSION__`），无需手动同步。

## 样式系统

- Tailwind CSS 3，`darkMode: 'class'`（通过 `<html class="dark">` 切换）。
- 颜色全部使用 HSL CSS 变量（`hsl(var(--primary))`）。
- 6 种主题色、2 种字体（Maple Mono / Fira Code，自托管 woff2），所有设置存 `localStorage`。
- 字体文件：`font-display: swap`。

## 渲染模式与架构（SSG 预渲染 + 动态 CSR 回退）

- **混合渲染架构**：采用「静态展示页面 SSG 预渲染 + 高动态日志分析 CSR」混合模式。
  - **SSG 预渲染页面**：`/`（首页）、`/api-docs`（文档）、`/sponsor`（赞助）、`/tutorials` 与教程文章、`/groups`（群列表）、`/terms`（服务协议）、`/privacy`（隐私政策）。构建期经由 `src/entry-server.ts` 与 `scripts/prerender.mjs` 预渲染为带完整 DOM 与元信息的静态 HTML 文件，实现 0 毫秒首屏加载与极佳 SEO。
  - **CSR 动态渲染页面**：`/:id`（日志查看与即时分析）保留纯客户端渲染。EdgeOne 在无匹配静态文件时回退至 `dist/index.html`，由客户端 `createSSRApp` 与 Vue Router 激活水合并接管 Web Worker 染色与 SSE 流式 AI 分析。
  - **构建链路**：`npm run build` 自动串联类型检查（`vue-tsc -b`）、客户端打包、SSR 打包（`dist-ssr/`）以及 `scripts/prerender.mjs` 静态预渲染注入，完成后自动清理 `dist-ssr/`，最终产物统一归入 `dist/`。

## 部署

- 当前无 CI 配置。
- **版本号体系**：不再使用语义化版本，基于 `{年}.{月}.{commit hash-7}`，仅用于 Releases 与 tag（例：`2026.8.0f6c096`）；页面不显示版本号，全局页脚显示「前端分发由腾讯 EdgeONE 提供 · {deployed hash-7}」。
- 部署方式：构建产物（`dist/`）上传腾讯 EdgeONE。
