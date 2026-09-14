import {
  createRouter,
  createWebHistory,
  createMemoryHistory,
  type RouteRecordRaw,
  type Router
} from 'vue-router'
import { setPageTitle, getCurrentPageTemplate } from '@/lib/pageTitle'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    alias: ['/index', '/index.html'],
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'home' }
  },
  {
    path: '/api-docs',
    alias: ['/api-docs/index', '/api-docs/index.html'],
    name: 'api-docs',
    component: () => import('../views/ApiDocsView.vue'),
    meta: { title: 'apiDocs' }
  },
  {
    path: '/sponsor',
    alias: ['/sponsor/index', '/sponsor/index.html'],
    name: 'sponsor',
    component: () => import('../views/SponsorView.vue'),
    meta: { title: 'sponsor' }
  },
  {
    path: '/tutorials',
    alias: ['/tutorials/index', '/tutorials/index.html'],
    name: 'tutorials',
    component: () => import('../views/TutorialsView.vue'),
    meta: { title: 'tutorials' }
  },
  {
    path: '/tutorials/:id',
    alias: ['/tutorials/:id/index', '/tutorials/:id/index.html'],
    name: 'tutorial-article',
    component: () => import('../views/TutorialArticleView.vue'),
    meta: { title: 'tutorialArticle' }
  },
  {
    path: '/groups',
    alias: ['/groups/index', '/groups/index.html'],
    name: 'groups',
    component: () => import('../views/GroupListView.vue'),
    meta: { title: 'groups' }
  },
  {
    path: '/launchers',
    alias: ['/launchers/index', '/launchers/index.html'],
    name: 'launchers',
    component: () => import('../views/LaunchersView.vue'),
    meta: { title: 'launchers' }
  },
  {
    path: '/terms',
    alias: [
      '/terms-of-service',
      '/terms/index',
      '/terms/index.html',
      '/terms-of-service/index',
      '/terms-of-service/index.html'
    ],
    name: 'terms',
    component: () => import('../views/TermsView.vue'),
    meta: { title: 'terms' }
  },
  {
    path: '/privacy',
    alias: [
      '/privacy-policy',
      '/privacy/index',
      '/privacy/index.html',
      '/privacy-policy/index',
      '/privacy-policy/index.html'
    ],
    name: 'privacy',
    component: () => import('../views/PrivacyView.vue'),
    meta: { title: 'privacy' }
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

export function createAppRouter(isServer = typeof window === 'undefined'): Router {
  const router = createRouter({
    history: isServer
      ? createMemoryHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
    routes
  })

  router.beforeEach((to, _, next) => {
    const rawPath = to.path

    // 针对 SSG 页面带 /index.html、/index 或 .html 后缀的访问做标准化自动重定向，防止客户端激活后误判 404
    if (
      rawPath !== '/' &&
      (rawPath.endsWith('/index.html') ||
        rawPath.endsWith('/index') ||
        rawPath.endsWith('.html') ||
        rawPath === '/index.html' ||
        rawPath === '/index')
    ) {
      let cleanPath = rawPath
        .replace(/\/(?:index(?:\.html)?)[\/]?$/i, '')
        .replace(/\.html$/i, '')
      if (!cleanPath) cleanPath = '/'
      return next({ path: cleanPath, query: to.query, hash: to.hash, replace: true })
    }

    // 防御 /:id 将 index 或 index.html 误当成日志 ID 导致请求 404
    if (to.name === 'log' && (to.params.id === 'index' || to.params.id === 'index.html')) {
      return next({ path: '/', query: to.query, hash: to.hash, replace: true })
    }

    // 防御 /tutorials/:id 将 index 误当成文章 ID
    if (
      to.name === 'tutorial-article' &&
      (to.params.id === 'index' || to.params.id === 'index.html')
    ) {
      return next({ path: '/tutorials', query: to.query, hash: to.hash, replace: true })
    }

    const template = (to.meta.title as string) || getCurrentPageTemplate(to.name?.toString())

    if (template === 'log' && to.params.id) {
      setPageTitle(template, { id: to.params.id as string })
    } else if (template === 'tutorialArticle' && to.params.id) {
      setPageTitle(template, { title: '加载中...' })
    } else {
      setPageTitle(template)
    }

    next()
  })

  return router
}

const router = createAppRouter()
export default router
