import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { createAppRouter } from './router'
import { getPageTitle, getCurrentPageTemplate } from './lib/pageTitle'

export async function render(url: string): Promise<{ html: string; title: string }> {
  const app = createSSRApp(App)
  const router = createAppRouter(true)

  app.use(router)

  await router.push(url)
  await router.isReady()

  const currentRoute = router.currentRoute.value
  const template =
    (currentRoute.meta.title as string) || getCurrentPageTemplate(currentRoute.name?.toString())

  let pageTitle = 'LogShare.CN'
  if (template === 'log' && currentRoute.params.id) {
    pageTitle = getPageTitle(template, { id: currentRoute.params.id as string })
  } else if (template === 'tutorialArticle' && currentRoute.params.id) {
    pageTitle = getPageTitle(template, { title: '教程' })
  } else {
    pageTitle = getPageTitle(template)
  }

  const html = await renderToString(app)

  return {
    html,
    title: pageTitle
  }
}
