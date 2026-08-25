# Changelog

## v1.7.1

适配后端 v1 大版本重构，前端仅作接口适配与界面调优。

### 接口适配
- 全量对齐上游 API：新增日志元信息（`/v1/log/{id}`）与附加文件（`/v1/raw/{id}/{filename}`，子路径分段编码）
- 上传支持 `files[]` 多文件单请求（≤200 个文件 / 累计 12MB），一个分享链接包含全部附件
- 错误响应兼容 `error` 字段（保留 `message` 兜底）；insights 采用 `analysis.problems/information` 结构
- SSE 解析重构：支持 LogAgent `event: status`（thinking/tool/tool_result/limit）与 `event: error`，正文增量 Markdown 实时渲染

### AI 分析（LogAgent）
- 恢复 LogAgent 智能分析面板：思维链/工具调用以可展开步骤时间线展示，默认折叠
- 流式光标、未闭合 Markdown 临时补全、自动跟随滚动（上滑暂停）

### 界面调优
- 日志页标题下新增摘要句（由接口字段动态拼接），替代服务器信息表格卡片
- 附加文件改为「显示当前文件」下拉切换，正文直接渲染所选文件
- 帮助提示改为可关闭 Tips；群列表按钮入口优化
- 新增群列表页面 `/groups`（官方群/启动器群/玩家社区/频道四组），双端导航接入
- 等宽字体固定为 SauceCode Mono（自托管 4 字重），移除字体切换
- 移除主题设置面板与旧版自托管字体

### 修复
- 日志解析桥接层并发化 + 超时自动重建 Worker，修复搜索竞态静默失败
- Service Worker 缓存策略重写（导航 network-first + assets cache-first + 离线兜底）
- § 颜色码 span 平衡闭合；补齐 `.format-obfuscated` 样式
- PWA 更新链路清理死代码；上传限制与后端对齐（10MiB）；token 统一存储
- manualChunks 分桶修正；移除无引用依赖（radix-vue/cva/clsx/tailwind-merge）
- index.html 移除自评结构化数据；SDK 文档标注过时警示

## v1.5.5

- 全量迁移 API 路径至 `/v1/`，弃用旧版 `/1/` 端点
- 新增删除日志确认对话框，防止误操作
- 更新 API 文档隐私过滤器列表，同步后端 13 项过滤规则

## v1.5.3

- 重构日志查看器工具栏，优化 AI 分析按钮布局和样式
- 新增 LogAnalysis 智能分析（基于 MiniMax M2.5 模型）
- 优化日志页帮助入口和按钮样式
- 顶栏重新设计，统一页面标题，删除广告位
- 新增 Friend Links
- 修复日志渲染背景问题

## v1.5.1

- 重构 API 文档并添加 SDK 支持
- 新增赞助者数据
- 更新 QQ 群链接和名称
- 修正 i18n 中 QQ 群名称错别字
- 更新 cnb.yml 以支持自动同步

## v1.3.6

- 重构整个前端（多次迭代）
- 重新设计 HomeView 和 LogView 页面
- 新增 PWA 支持（可安装、离线缓存）
- 新增点阵背景
- 新增字体切换（默认 Maple Mono 等宽字体）
- 新增赞助页面和教程中心
- 新增 QQ 群入口
- 重写 API 文档，删除免责声明页面
- 升级日志渲染高亮，新增完整 Meta 标签
- 支持压缩包日志解析
- 完善 i18n 国际化
- 新增 Sitemap 和 Robots
- 整理 CSS 和 TypeScript 代码

## v1.1.0

- 首页大改，移动端页脚修改
- 新增压缩包日志支持
- 重写 SDK，更新 API 地址
- 网站改名
- UI 圆角恢复

## v1.0.0

- 首次发布
