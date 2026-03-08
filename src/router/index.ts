import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LogView from '../views/LogView.vue'
import ApiDocsView from '../views/ApiDocsView.vue'
import ImprintView from '../views/ImprintView.vue'
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue'
import SponsorView from '../views/SponsorView.vue'
import TutorialsView from '../views/TutorialsView.vue'
import TutorialArticleView from '../views/TutorialArticleView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { setPageTitle, getCurrentPageTemplate } from '@/lib/pageTitle'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'home' }
    },
    {
      path: '/api-docs',
      name: 'api-docs',
      component: ApiDocsView,
      meta: { title: 'apiDocs' }
    },
    {
      path: '/imprint',
      name: 'imprint',
      component: ImprintView,
      meta: { title: 'imprint' }
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: PrivacyPolicyView,
      meta: { title: 'privacy' }
    },
    {
      path: '/sponsor',
      name: 'sponsor',
      component: SponsorView,
      meta: { title: 'sponsor' }
    },
    {
      path: '/tutorials',
      name: 'tutorials',
      component: TutorialsView,
      meta: { title: 'tutorials' }
    },
    {
      path: '/tutorials/:id',
      name: 'tutorial-article',
      component: TutorialArticleView,
      meta: { title: 'tutorialArticle' }
    },
    {
      path: '/:id',
      name: 'log',
      component: LogView,
      meta: { title: 'log' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: '404' }
    }
  ]
})

// 全局路由守卫：更新页面标题
router.beforeEach((to, _, next) => {
  const template = to.meta.title as string || getCurrentPageTemplate(to.name?.toString());

  if (template === 'log' && to.params.id) {
    setPageTitle(template, { id: to.params.id as string });
  } else if (template === 'tutorialArticle' && to.params.id) {
    setPageTitle(template, { title: '加载中...' });
  } else {
    setPageTitle(template);
  }

  next();
});

export default router
