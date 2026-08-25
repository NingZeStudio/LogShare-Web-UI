/**
 * 应用版本号，构建时由 vite.config.ts 从 package.json 注入。
 */
declare const __APP_VERSION__: string

export const APP_VERSION: string = __APP_VERSION__
