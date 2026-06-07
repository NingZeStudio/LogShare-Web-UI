# LogShare Web UI Agent Guide

LogShare.CN 前端：Vue 3 + TypeScript + Vite 7 + Tailwind CSS 3，用 npm（`package-lock.json`，`packageManager: npm@11.12.1`）。

## Commands

- `npm run dev` 启动 Vite 开发服务器。
- `npm run build` 先执行 `vue-tsc -b` 再 `vite build`；这是唯一内置类型检查命令。
- `npm run preview` 预览 `dist/`。
- `npm run lint` 会对 `.vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts` 运行 ESLint 并自动修复。
- `npm run format` 对全仓库运行 Prettier。
- 没有测试框架或单测脚本；改动验证通常用 `npm run build`，需要风格检查时另跑 `npm run lint`。

## Entrypoints And Wiring

- App 入口是 `src/main.ts`，注册 router 后挂载，并在 `load` 后注册 `/sw.js`。
- 路由硬编码在 `src/router/index.ts` 且全部懒加载；新增/改名路由时同步检查 `src/App.vue` 导航、`src/components/MobileNav.vue` 移动端导航、`src/lib/pageTitle.ts` 标题模板/switch。
- API 统一从 `src/lib/ApiClient.ts` 走，`baseURL` 硬编码为 `https://api.logshare.cn`；SSE AI 分析用 `streamAiAnalysis()` / `streamAiAnalyseByContent()`。
- 后端接口说明在 `API.md`；不要凭端点名猜请求/响应。
- i18n 是自定义实现，不是 vue-i18n：文案在 `src/lib/i18nConfig.ts`，运行时在 `src/lib/i18n.ts`，语言存在 localStorage `preferred_language`，切换组件当前通过刷新页面生效。

## Gotchas

- `tsconfig.app.json` 开启 `strict`、`noUnusedLocals`、`noUnusedParameters`、`noUncheckedSideEffectImports`、`erasableSyntaxOnly`；不要用 TypeScript `enum`/`namespace`，类型导入用 `import type`。
- ESLint 里的 unused/`any`/`vue/no-v-html` 多为 warn，但 `vue-tsc` 的 TS 错误会让 `npm run build` 失败；`build` 不会自动 lint。
- Tailwind dark mode 是 `class` 策略；颜色来自 HSL CSS 变量（如 `hsl(var(--primary))`），字体通过 `--font-sans` / `--font-mono` 和自托管 woff2。
- `src/lib/logParser.ts` 直接输出 HTML 字符串；Minecraft `§` 颜色码映射在 `formatContent()`，改映射时同步 CSS 类。
- PWA 更新链路横跨 `public/sw.js`、`src/main.ts`、`src/components/PwaUpdateToast.vue`，通过 `BroadcastChannel('pwa-update')` 和 `pwa-update-available` 事件通知；改 SW 或缓存名要验证更新提示流程。
- 公告内容和已读状态在 `src/lib/announcementConfig.ts`；修改 `announcementConfig.id` 会让用户重新看到公告。

## Build And Deploy Notes

- `vite.config.ts` 有自定义构建报告插件，构建结束会扫描 `dist/` 并打印文件/ gzip 统计。
- Vite 手动分包名包括 `markdown`、`vue-core`、`axios`、`ui-components`、`utils`、`vendor`，`chunkSizeWarningLimit` 是 500 KB。
- `.cnb.yml` 在 `main` push 时把当前 HEAD force push 到 GitHub 镜像仓库 `NingZeStudio/McLogs-Next-UI`；不要把它当普通 CI 测试流水线。

## Style

- Prettier：无分号、单引号、行宽 100、2 空格、`trailingComma: none`、`arrowParens: avoid`、LF。
- ESLint flat config 忽略 `public/**` 和 `package-lock.json`；不要期望 `public/sw.js` 被 lint 自动修复。
