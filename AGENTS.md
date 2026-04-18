# McLogs Next UI - OpenCode Agent Guide

## Project Overview

LogShare.CN 前端项目 - Minecraft/Hytale 日志分享与分析平台，基于 Vue 3 + TypeScript + Vite 构建。

## Package Manager

使用 pnpm 进行依赖管理（项目包含 pnpm-lock.yaml）

## Essential Commands

### Development

```bash
pnpm run dev          # 启动开发服务器 (vite)
pnpm run build        # 构建生产版本 (vue-tsc -b && vite build)
pnpm run preview      # 预览构建结果 (vite preview)
```

### Type Checking

```bash
vue-tsc -b            # TypeScript 类型检查（build 命令会自动执行）
```

## Architecture Notes

### Entry Points

- **Main entry**: `src/main.ts` - 应用入口和 Service Worker 注册
- **Router**: `src/router/index.ts` - 路由配置，包含页面守卫
- **API Client**: `src/lib/ApiClient.ts` - 封装所有 API 调用
- **i18n**: `src/lib/i18n.ts` + `src/lib/i18nConfig.ts` - 国际化支持（zh-CN, zh-TW）

### Project Structure

- `src/views/` - 页面组件（Home, LogView, ApiDocs, Tutorials, Sponsor, 404）
- `src/components/` - 可复用组件（PWA 相关、主题设置、导航等）
- `src/lib/` - 工具函数和配置（API 客户端、i18n、日志解析等）
- `src/data/` - 静态数据（赞助商信息等）
- `public/` - 静态资源（Service Worker, manifest, 图标等）

### Important Conventions

#### PWA Update Mechanism

Service Worker 更新依赖 BroadcastChannel 通信，修改 Service Worker 或相关逻辑后必须测试 PWA 更新流程：

- `src/main.ts:12-58` 包含 Service Worker 注册和更新检测
- `public/sw.js` - Service Worker 实现
- 更新通知通过 `BroadcastChannel('pwa-update')` 发送

#### Router Configuration

路由配置硬编码在 `src/router/index.ts`，修改路由时需同时更新：

- Router 配置中的 path 和 meta.title
- 导航组件（`src/App.vue` 中的链接）
- 页面标题模板（`src/lib/pageTitle.ts:1-9`）
- `getCurrentPageTemplate()` 函数中的 switch 语句（src/lib/pageTitle.ts:30-46）

#### API Configuration

API 基础地址硬编码在 `src/lib/ApiClient.ts:4`，当前为 `https://api.logshare.cn`
修改时需同步更新相关文档和注释

#### Log Parsing

日志解析逻辑硬编码在 `src/lib/logParser.ts:2-164`，扩展新日志格式需修改 `parseLog()` 函数：

- 日志级别检测：`getLevel()` 函数（第 5-13 行）
- Minecraft 颜色代码映射硬编码在 `formatContent()` 函数中（第 114-121 行），修改时需同步更新 CSS 类
- 堆栈跟踪格式化硬编码在第 131-163 行

#### TypeScript Configuration

- Strict mode 启用（`tsconfig.app.json:12`）
- 包含严格检查：`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- 类型错误会导致构建失败

## Build & Deployment

### Build Output

- 构建产物位于 `dist/` 目录
- 自定义构建报告插件会在构建完成后输出详细统计（vite.config.ts:73-181）
- 代码分割策略：markdown、vue-core、axios、ui-components、utils 等独立 chunk

### Chunk Size Warning

构建时 chunk 大小警告阈值设为 500KB（vite.config.ts:218）

## Testing & Quality

### Current Status

- **无测试框架**：项目中未配置测试工具
- **无 Linting**：未配置 ESLint 或 Prettier
- **无 CI/CD**：未配置自动化构建和部署流程

### Recommendations

建议添加代码质量工具以提高代码一致性：

```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
```

## Development Gotchas

### i18n Implementation

使用自定义 i18n 实现（非 vue-i18n），通过 `t()` 函数获取翻译文本：

- 语言包定义在 `src/lib/i18nConfig.ts`
- 语言检测基于浏览器语言和 localStorage
- 切换语言后需调用 `updateCurrentLanguagePack()` 更新缓存

### Tailwind CSS

- Dark mode 使用 class 策略（`tailwind.config.js:3`）
- 颜色使用 CSS 变量系统（HSL 格式）
- 自定义主题配置在 `tailwind.config.js:8-68`

### Component Patterns

- 使用 Vue 3 Composition API (`<script setup>`)
- 图标使用 `lucide-vue-next`
- UI 组件基于 Radix Vue 和 Tailwind CSS

## Environment Variables

项目当前未使用环境变量配置，所有配置均为硬编码。如需添加：

1. 创建 `.env` 文件
2. 使用 `import.meta.env.VARIABLE_NAME` 访问
3. 更新 TypeScript 类型定义

## API Integration

后端 API 文档位于 `API_DOC.md`，主要端点：

- `POST /1/log` - 提交日志
- `GET /1/raw/{id}` - 获取原始日志
- `GET /1/insights/{id}` - 获取日志洞察
- `DELETE /1/delete/{id}` - 删除日志（需 Token）
- `GET /1/limits` - 获取限制信息
- `GET /1/filters` - 获取过滤器信息

## Performance Considerations

- 路由使用懒加载（`import()` 语法）
- 外部域名预连接（index.html:52-54）
- 静态资源通过 Service Worker 缓存
- 构建时自动代码分割和优化
