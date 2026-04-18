import { createRouter, createWebHistory } from 'vue-router'
import { setPageTitle, getCurrentPageTemplate } from '@/lib/pageTitle'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 已知屎山：路由配置硬编码，修改路由需同时修改此处和导航组件
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'home' }
    },
    {
      path: '/api-docs',
      name: 'api-docs',
      component: () => import('../views/ApiDocsView.vue'),
      meta: { title: 'apiDocs' }
    },
    {
      path: '/sponsor',
      name: 'sponsor',
      component: () => import('../views/SponsorView.vue'),
      meta: { title: 'sponsor' }
    },
    {
      path: '/tutorials',
      name: 'tutorials',
      component: () => import('../views/TutorialsView.vue'),
      meta: { title: 'tutorials' }
    },
    {
      path: '/tutorials/:id',
      name: 'tutorial-article',
      component: () => import('../views/TutorialArticleView.vue'),
      meta: { title: 'tutorialArticle' }
    },
    {
      path: '/:id',
      name: 'log',
      component: () => import('../views/LogView.vue'),
      meta: { title: 'log' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: '404' }
    }
  ]
})

router.beforeEach((to, _, next) => {
  const template = (to.meta.title as string) || getCurrentPageTemplate(to.name?.toString())

  if (template === 'log' && to.params.id) {
    setPageTitle(template, { id: to.params.id as string })
  } else if (template === 'tutorialArticle' && to.params.id) {
    // 警告：教程标题显示"加载中..."，实际标题应在 TutorialArticleView 中设置
    setPageTitle(template, { title: '加载中...' })
  } else {
    setPageTitle(template)
  }

  next()
})

export default router
