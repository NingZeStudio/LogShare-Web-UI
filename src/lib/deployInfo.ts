/**
 * 部署标识：构建时由 vite.config.ts 注入的 commit hash 前 7 位。
 * 版本号体系已改为 {年}.{月}.{hash-7}，仅用于 Releases 与 tag，页面不再显示语义化版本。
 */
declare const __DEPLOY_HASH__: string

export const DEPLOY_HASH: string = __DEPLOY_HASH__
