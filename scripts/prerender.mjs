import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')
const serverDistDir = path.resolve(rootDir, 'dist-ssr')

// 需要预渲染为纯静态 HTML 的页面清单
const routesToPrerender = [
  '/',
  '/api-docs',
  '/sponsor',
  '/tutorials',
  '/tutorials/tutorials-collection',
  '/tutorials/mobileglues-setup',
  '/tutorials/ask-questions-effectively',
  '/tutorials/basic-concepts',
  '/groups',
  '/terms',
  '/terms-of-service',
  '/privacy',
  '/privacy-policy'
]

async function prerender() {
  console.log('\n🚀 开始执行 SSG 静态预渲染 (Prerendering)...\n')

  const templatePath = path.resolve(distDir, 'index.html')
  if (!fs.existsSync(templatePath)) {
    throw new Error(`找不到客户端构建入口模板: ${templatePath}，请先执行客户端构建`)
  }

  const template = fs.readFileSync(templatePath, 'utf-8')

  // 引入 SSR 构建产物
  const serverEntryPath = path.resolve(serverDistDir, 'entry-server.js')
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error(`找不到 SSR 入口模块: ${serverEntryPath}，请先执行 SSR 构建`)
  }

  const { render } = await import(`file://${serverEntryPath}`)

  let count = 0
  for (const url of routesToPrerender) {
    try {
      const { html: appHtml, title } = await render(url)

      let rendered = template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)

      if (title) {
        rendered = rendered.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      }

      let filePath = ''
      if (url === '/') {
        filePath = path.resolve(distDir, 'index.html')
      } else {
        const routeDir = path.resolve(distDir, url.replace(/^\//, ''))
        fs.mkdirSync(routeDir, { recursive: true })
        filePath = path.resolve(routeDir, 'index.html')
      }

      fs.writeFileSync(filePath, rendered, 'utf-8')
      count++
      console.log(`  ✓ 成功预渲染: ${url.padEnd(38)} -> ${path.relative(rootDir, filePath)}`)
    } catch (err) {
      console.error(`  ✗ 预渲染失败 [${url}]:`, err)
    }
  }

  // 清理临时 SSR 构建目录
  try {
    fs.rmSync(serverDistDir, { recursive: true, force: true })
  } catch {}

  console.log(`\n🎉 SSG 静态预渲染完成！共生成 ${count} 个静态 HTML 页面。未预渲染的动态路由 (如 /:id) 仍由客户端 CSR 渲染。\n`)
}

prerender().catch(err => {
  console.error('SSG 预渲染发生错误:', err)
  process.exit(1)
})
