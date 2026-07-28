# LogShare.CN Web UI — Agent Guide

Vue 3 + TypeScript 5 + Vite 7 前端，Minecraft/Hytale 日志分享与分析平台。

## 开发环境

- **Termux/Android：** 使用 `nub run <script>` 替代 `npm run`（见 `~/.config/opencode/NUBDOC.md`）。运行 `.ts` 文件时，用 `node --experimental-strip-types` 或 `tsx`，`nub <file.ts>` 会报错。
- **无测试框架。** 验证改动只用 `npm run build`（含 `vue-tsc -b` 类型检查），风格检查另跑 `npm run lint`。

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

### PWA 更新链路（3 个文件）
涉及 `public/sw.js`、`src/main.ts`、`src/components/PwaUpdateToast.vue`。修改后必须验证：
- `BroadcastChannel('pwa-update')` — SW 与主线程通信
- `window.dispatchEvent(new CustomEvent('pwa-update-available'))` — Vue 组件监听
- `public/sw.js` **不会被 ESLint 检查和修复**

### 日志解析与 CSS 耦合
`src/lib/logParser.ts` 输出 HTML 字符串（非 Vue 组件）。`formatContent()` 中的 `styleMap` 颜色映射必须与 `src/assets/LogsAnalysis.css` 中的 `.format-*` 类名保持同步。
### API 层

- 所有 HTTP 请求统一通过 `src/lib/ApiClient.ts`，`baseURL = 'https://api.logshare.cn'`（硬编码）。
- 后端已弃用 `/1/` 端点，前端统一使用 `/v1/` 路径（`/v1/log`、`/v1/raw/{id}`、`/v1/insights/{id}`、`/v1/ai/{id}`、`/v1/ai/analyse`、`/v1/limits`、`/v1/filters`）。
- AI 分析 SSE 使用原生 `fetch`（非 Axios），OpenAI 兼容格式：`choices[0].delta.content`。
- 敏感信息脱敏由后端 `/v1/filters` 配置，前端不处理。
- `apiDocsUtils.ts` 中的代码示例硬编码，更新 API 时同步修改。

### i18n
- **自定义实现**，非 vue-i18n。文案在 `src/lib/i18nConfig.ts`（`zhCN`/`zhTW`），运行时用 `src/lib/i18n.ts` 的 `t(key)`。
- 语言切换后**必须刷新页面**才能生效（存在 `localStorage.preferred_language`）。

### 硬编码数据
- `src/lib/apiDocsUtils.ts` — API 代码示例硬编码，更新 API 时同步修改。
- `src/views/TutorialArticleView.vue` — 教程数据硬编码在组件中。
- `src/data/sponsors.ts` — 赞助者数据硬编码。

## 样式系统

- Tailwind CSS 3，`darkMode: 'class'`（通过 `<html class="dark">` 切换）。
- 颜色全部使用 HSL CSS 变量（`hsl(var(--primary))`）。
- 6 种主题色、2 种字体（Maple Mono / Fira Code，自托管 woff2），所有设置存 `localStorage`。
- 字体文件：`font-display: swap`。

## 部署

- 当前无 CI 配置。
