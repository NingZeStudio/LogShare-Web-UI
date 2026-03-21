# LogShareUI-v1

> 本项目在开发初期因时间紧迫，曾使用 Qwen 辅助生成部分代码，但核心逻辑均为人工编写。由于 AI 辅助生成的代码存在冗余和低质量问题，我们正在进行全面的代码清理工作。目前清理工作仍在进行中，部分模块可能仍包含待优化的代码，敬请谅解。

LogShare-v1的官方开源Web UI实现方案，基于Vue+Typesctipt+TailwindCSS。

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue.js-3.x-4FC08D.svg?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🚀 项目简介

LogShareUI-v1 是一个现代化的前端应用程序，专为 Minecraft 服务器管理员设计，用于分享、分析和诊断服务器日志。该项目基于 Vue 3 + TypeScript + Tailwind CSS 构建，提供了流畅的用户体验和强大的日志分析功能。

主要特点：
- 简化日志分享：通过唯一 URL 轻松分享大型日志文件
- 智能错误分析：与后端 API 集成，自动检测问题并提供解决方案
- 隐私保护：内置过滤机制，自动隐藏敏感信息
- 现代化界面：响应式设计，支持深色模式

## ✨ 核心功能

- 日志分享：通过唯一 URL 分享大型日志文件，无需复杂上传流程
- 智能分析：与后端 API 集成，自动识别服务器软件类型，精准检测错误并提供解决方案
- 隐私保护：智能过滤算法，自动隐藏日志中的敏感信息（如 IP 地址）
- 现代化 UI：基于 Radix-Vue 和 Tailwind CSS 构建，完美适配移动端和桌面端，支持深色模式
- 拖拽上传：支持拖拽文件到编辑区域进行上传
- 多语言支持：内置国际化支持

## 🛠️ 技术栈

层级	技术	描述
前端框架	Vue 3, TypeScript	现代化 SPA 架构
UI 框架	Tailwind CSS, Radix-Vue	极简且高度可定制的 UI 组件
图标库	Lucide Vue	一致且可访问的图标集
构建工具	Vite	快速的构建和开发体验
路由	Vue Router	基于 History 的路由系统
HTTP 客户端	Axios	API 请求处理
Markdown 渲染	Markdown-it	AI 分析结果渲染

## 📦 依赖组件

生产依赖
- `vue`: ^3.5.24
- `vue-router`: ^4.6.4
- `axios`: ^1.13.2 (HTTP 客户端)
- `tailwindcss`: ^3.4.17 (CSS 框架)
- `radix-vue`: ^1.9.17 (UI 组件)
- `lucide-vue-next`: ^0.562.0 (图标)
- `markdown-it`: ^14.1.0 (Markdown 渲染)
- `@tailwindcss/typography`: ^0.5.19 (排版样式)

## 开发依赖
- `typescript`: 5.9.3
- `vite`: ^7.2.4
- `@vitejs/plugin-vue`: ^6.0.1
- `vue-tsc`: ^3.1.4 (TypeScript 检查)

## 🚀 快速启动

环境要求
- Node.js (20+)
- yarn

### 开发环境设置

1. 克隆项目

```bash
   git clone https://cnb.cool/MornZe-Dev/LogShareUI-v1
   cd LogShareUI-v1
   ```

2. 安装依赖

```bash
   yarn install
   ```

3. 启动开发服务器

```bash
   yarn dev
   ```


   应用将在 `http://localhost:5173` 上运行。

4. 构建生产版本

```bash
   yarn build
   ```


   构建输出将在 `dist/` 目录中。

5. 预览生产构建

```bash
   yarn preview
   ```

## 🔧 配置说明

### API 代理配置

开发环境中，Vite 配置了 API 代理，将 `/api` 请求转发到后端 API 服务器：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://api.logshare.cn',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      headers: {
          'Host': 'api.logshare.cn'
      }
    }
  }
}
```

### 代码分割

项目实现了智能代码分割以优化加载性能：
- Vue 核心库单独打包
- UI 组件单独打包
- Markdown 渲染库单独打包
- 各页面组件独立打包

## 🌐 部署配置

本项目使用 Vue Router 的 **History 模式**，部署时需要配置服务器将所有非文件请求重定向到 `index.html`。

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（可选）
    location /api {
        proxy_pass https://api.logshare.cn;
        proxy_set_header Host api.logshare.cn;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Apache 配置

在项目根目录或 `dist/` 目录下创建 `.htaccess` 文件：

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

### Caddy 配置

```caddyfile
your-domain.com {
    root * /path/to/dist
    file_server
    try_files {uri} {uri}/ /index.html
}
```

### 重要提示

> ⚠️ **必须配置伪静态规则**：所有非静态文件（CSS、JS、图片等）的请求都必须重定向到 `index.html`，否则直接刷新页面会导致 404 错误。

## 📊 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 可复用组件
│   ├── HelloWorld.vue
│   └── LanguageSwitcher.vue
├── lib/              # 工具函数和配置
│   ├── api.ts        # API 客户端配置
│   ├── i18n.ts       # 国际化配置
│   └── pageTitle.ts  # 页面标题管理
├── router/           # 路由配置
│   └── index.ts
├── views/            # 页面组件
│   ├── HomeView.vue  # 首页
│   ├── LogView.vue   # 日志详情页
│   ├── ApiDocsView.vue # API 文档页
│   ├── ImprintView.vue # 法律声明页
│   └── PrivacyPolicyView.vue # 隐私政策页
├── App.vue           # 主应用组件
└── main.ts           # 应用入口
```
