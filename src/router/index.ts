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
    path: '/groups',
    name: 'groups',
    component: () => import('../views/GroupListView.vue'),
    meta: { title: 'groups' }
  },
  {
    path: '/launchers',
    name: 'launchers',
    component: () => import('../views/LaunchersView.vue'),
    meta: { title: 'launchers' }
  },
  {
    path: '/terms',
    alias: '/terms-of-service',
    name: 'terms',
    component: () => import('../views/TermsView.vue'),
    meta: { title: 'terms' }
  },
  {
    path: '/privacy',
    alias: '/privacy-policy',
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
