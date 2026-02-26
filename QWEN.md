# McLogs Next UI - 项目上下文文档

## 项目概述

**McLogs Next UI** 是 McLogs-Next-API 的官方开源 Web UI 实现，一个专为 Minecraft 服务器管理员设计的现代化日志分享与分析平台。用户可以轻松上传、分享和分析 Minecraft/Hytale 服务器日志，并通过 AI 智能分析获取问题诊断和解决方案。

### 核心功能
- **日志分享**: 通过唯一 URL 分享大型日志文件
- **智能分析**: 与后端 API 集成，自动检测问题并提供解决方案
- **隐私保护**: 自动过滤敏感信息（如 IP 地址）
- **现代化界面**: 响应式设计，支持深色模式
- **多语言支持**: 内置简体中文和繁体中文国际化

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 + TypeScript | 3.5.24 |
| 构建工具 | Vite | 7.2.4 |
| CSS 框架 | Tailwind CSS | 3.4.17 |
| UI 组件 | Radix-Vue | 1.9.17 |
| 图标库 | Lucide Vue Next | 0.562.0 |
| 路由 | Vue Router | 4.6.4 (Hash 模式) |
| HTTP 客户端 | Axios | 1.13.2 |
| Markdown 渲染 | markdown-it | 14.1.0 |

## 项目结构

```
McLogs-Next-UI/
├── public/                 # 静态资源
│   ├── css/               # 公共样式
│   ├── img/               # 公共图片
│   └── sdk/               # SDK 相关文件
├── src/
│   ├── assets/            # 项目资源文件
│   ├── components/        # 可复用组件
│   │   ├── HelloWorld.vue
│   │   └── LanguageSwitcher.vue  # 语言切换器
│   ├── lib/               # 工具库
│   │   ├── api.ts         # API 客户端配置 (baseURL: https://api.logshare.cn)
│   │   ├── apiDocsUtils.ts # API 文档工具函数
│   │   ├── i18n.ts        # 国际化配置 (zh-CN / zh-TW)
│   │   ├── localStorage.ts # 本地存储工具
│   │   ├── logParser.ts   # 日志解析工具
│   │   ├── logViewUtils.ts # 日志视图工具
│   │   ├── pageTitle.ts   # 页面标题管理
│   │   └── sharedUtils.ts # 共享工具函数
│   ├── router/
│   │   └── index.ts       # 路由配置 (Hash 模式)
│   ├── views/             # 页面组件
│   │   ├── HomeView.vue        # 首页 - 日志上传/粘贴
│   │   ├── LogView.vue         # 日志详情页 - 日志展示与分析
│   │   ├── ApiDocsView.vue     # API 文档页
│   │   ├── ImprintView.vue     # 法律声明页
│   │   └── PrivacyPolicyView.vue # 隐私政策页
│   ├── App.vue          # 主应用组件 (主题切换/导航/页脚)
│   ├── main.ts          # 应用入口
│   └── style.css        # 全局样式
├── index.html           # HTML 入口
├── package.json         # 项目配置和依赖
├── tsconfig.json        # TypeScript 配置
├── tailwind.config.js   # Tailwind CSS 配置
├── postcss.config.js    # PostCSS 配置
└── vite.config.ts       # Vite 配置 (含 API 代理和代码分割)
```

## 构建和运行

### 环境要求
- Node.js 20+
- yarn

### 开发环境

```bash
# 安装依赖
yarn install

# 启动开发服务器 (端口 5173，含 API 代理)
yarn dev

# 类型检查
yarn vue-tsc -b
```

### 生产构建

```bash
# 构建生产版本
yarn build

# 预览生产构建
yarn preview
```

### API 代理配置

开发环境中，Vite 配置了 API 代理将 `/api` 请求转发到后端：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://api.mclogs.lemwood.icu',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      headers: { 'Host': 'api.mclogs.lemwood.icu' }
    }
  }
}
```

生产环境 API 地址：`https://api.logshare.cn`

## 路由系统

采用 **History 模式** 路由：

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | HomeView | 首页 - 日志上传/粘贴 |
| `/:id` | LogView | 日志详情页 |
| `/api-docs` | ApiDocsView | API 文档 |
| `/imprint` | ImprintView | 法律声明 |
| `/privacy` | PrivacyPolicyView | 隐私政策 |

### 部署配置

**重要**: History 模式需要服务器配置伪静态规则，将所有非文件请求重定向到 `index.html`。

**Nginx 配置**:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache 配置** (`.htaccess`):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 开发规范

### 代码风格
- 使用 **TypeScript** 进行类型安全开发
- Vue 组件使用 `<script setup lang="ts">` 语法
- 路径别名：`@` 指向 `src/` 目录

### Tailwind CSS 配置
- 支持深色模式：`darkMode: 'class'`
- 使用 CSS 变量定义颜色系统（border, background, primary, secondary 等）
- 启用 `@tailwindcss/typography` 插件用于 Markdown 渲染

### 代码分割策略

项目实现了智能代码分割优化加载性能：

```typescript
// vite.config.ts - manualChunks
- vue-core: Vue 核心库
- markdown: markdown-it 库
- axios: HTTP 客户端
- ui-components: Radix-Vue + Lucide 图标
- utils: class-variance-authority, clsx, tailwind-merge
- home/log/api-docs/imprint/privacy: 页面级代码分割
```

### 国际化 (i18n)

内置简体中文 (`zhCN`) 和繁体中文 (`zhTW`) 语言包：

```typescript
// src/lib/i18n.ts
import { t, detectSystemLanguage, updateCurrentLanguagePack } from '@/lib/i18n'

// 检测系统语言
const lang = detectSystemLanguage() // 'zh-CN' | 'zh-TW'

// 翻译函数
t('home_title') // 返回对应语言的翻译
```

### 本地存储键值

| 键名 | 说明 |
|------|------|
| `theme` | 主题偏好：`'light'` 或 `'dark'` |
| `preferred_language` | 语言偏好：`'zh-CN'` 或 `'zh-TW'` |
| `cookie_consent` | Cookie 同意状态：`'true'` |

## 新增功能：压缩包批量上传

### 支持的压缩格式
- **ZIP**: 完全支持，使用 JSZip 在浏览器端解析

### 支持的文件类型
`.txt`, `.log`, `.yml`, `.yaml`, `.json`, `.xml`, `.cfg`, `.conf`, `.properties`, `.toml`

### 核心模块 (`src/lib/archiveParser.ts`)

```typescript
import { parseArchive, isArchiveFile, isTextFile } from '@/lib/archiveParser'

// 解析压缩包
const files = await parseArchive(file) // 返回 ExtractedFile[]

// 检查文件类型
isArchiveFile('test.zip') // true
isTextFile('server.log')  // true
```

### 批量上传流程
1. 用户上传 ZIP 压缩包
2. 前端解析并提取所有文本文件
3. 展示文件列表（文件名、路径、大小）
4. 用户可选择：
   - 批量上传所有文件
   - 单独上传某个文件
   - 移除不需要的文件
5. 显示上传进度和结果（成功/失败状态）

### 依赖
- `jszip`: ^3.10.1 - ZIP 文件解析

## 核心 API 模块

### API 客户端 (`src/lib/api.ts`)

```typescript
import { apiClient, getApiUrl } from '@/lib/api'

// API 基础地址
const baseURL = 'https://api.logshare.cn'

// 创建 Axios 实例
apiClient.get('/endpoint')

// 获取完整 API URL
getApiUrl('/endpoint')
```

### 日志解析工具 (`src/lib/logParser.ts`)
- 解析 Minecraft 日志格式
- 提取错误、警告信息
- 识别服务器软件类型

### 页面标题管理 (`src/lib/pageTitle.ts`)
- 统一管理页面标题
- 支持动态参数（如日志 ID）

## 注意事项

1. **路由守卫**: `src/router/index.ts` 中的 `beforeEach` 守卫负责更新页面标题，修改时需谨慎
2. **API 地址**: 开发环境使用 `api.mclogs.lemwood.icu`，生产环境使用 `api.logshare.cn`
3. **深色模式**: 通过 `document.documentElement.classList.add('dark')` 切换
4. **代码分割**: 修改 `vite.config.ts` 的 `manualChunks` 时需保持 chunk 大小合理
