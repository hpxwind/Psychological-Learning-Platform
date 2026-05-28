import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomePage from '@/pages/HomePage.vue'
import SearchPage from '@/pages/SearchPage.vue'
import EffectsPage from '@/pages/EffectsPage.vue'
import EffectDetailPage from '@/pages/EffectDetailPage.vue'
import BooksPage from '@/pages/BooksPage.vue'
import BookDetailPage from '@/pages/BookDetailPage.vue'
import VideosPage from '@/pages/VideosPage.vue'
import VideoDetailPage from '@/pages/VideoDetailPage.vue'
import AdminLoginPage from '@/pages/AdminLoginPage.vue'
import AdminDashboardPage from '@/pages/AdminDashboardPage.vue'
import AIFullChatPage from '@/pages/AIFullChatPage.vue'
import SelfTestPage from '@/pages/SelfTestPage.vue'
import ScaleIntroPage from '@/pages/ScaleIntroPage.vue'
import ScaleReportPage from '@/pages/ScaleReportPage.vue'
import ScaleTestPage from '@/pages/ScaleTestPage.vue'
import TestResultPage from '@/pages/TestResultPage.vue'
import CelebrityChatPage from '@/pages/CelebrityChatPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/ai-chat',
    name: 'ai-chat',
    component: AIFullChatPage,
  },
  {
    path: '/celebrity-chat',
    name: 'celebrity-chat',
    component: CelebrityChatPage,
  },
  {
    path: '/self-test',
    name: 'self-test',
    component: SelfTestPage,
    meta: { noLayout: true },
  },
  {
    path: '/self-test/intro/:id',
    name: 'scale-intro',
    component: ScaleIntroPage,
    meta: { noLayout: true },
  },
  {
    path: '/self-test/report/:id',
    name: 'scale-report',
    component: ScaleReportPage,
    meta: { noLayout: true },
  },
  {
    path: '/self-test/test/:id',
    name: 'scale-test',
    component: ScaleTestPage,
    meta: { noLayout: true },
  },
  {
    path: '/self-test/result',
    name: 'test-result',
    component: TestResultPage,
    meta: { noLayout: true },
  },
  {
    path: '/search',
    name: 'search',
    component: SearchPage,
  },
  {
    path: '/effects',
    name: 'effects',
    component: EffectsPage,
  },
  {
    path: '/effects/:id',
    name: 'effect-detail',
    component: EffectDetailPage,
    meta: { noLayout: true },
  },
  {
    path: '/books',
    name: 'books',
    component: BooksPage,
  },
  {
    path: '/books/:id',
    name: 'book-detail',
    component: BookDetailPage,
    meta: { noLayout: true },
  },
  {
    path: '/videos',
    name: 'videos',
    component: VideosPage,
  },
  {
    path: '/videos/:id',
    name: 'video-detail',
    component: VideoDetailPage,
    meta: { noLayout: true },
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLoginPage,
    meta: { noLayout: true },
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardPage,
    meta: { requiresAuth: true, noLayout: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'admin-login' })
  } else {
    next()
  }
})

export default router
