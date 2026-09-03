<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import {
  PhHeart as Heart,
  PhBookOpen as BookOpen,
  PhFileText as FileText,
  PhUsers as Users,
  PhSun as Sun,
  PhMoon as Moon,
  PhMonitor as Monitor,
  PhChatCircle as MessageCircle,
  PhGithubLogo as Github,
  PhArrowSquareOut as ExternalLink
} from '@phosphor-icons/vue'
import PwaUpdateToast from '@/components/PwaUpdateToast.vue'
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
import WafBlockDialog from '@/components/WafBlockDialog.vue'
import MobileNav from '@/components/MobileNav.vue'
import LanguageMenu from '@/components/LanguageMenu.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import { setPageTitle, getCurrentPageTemplate } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'
import { DEPLOY_HASH } from '@/lib/deployInfo'

const route = useRoute()
const showEasterEgg = ref(false)
const announcementDialogRef = ref<InstanceType<typeof AnnouncementDialog> | null>(null)

provide('announcementDialog', announcementDialogRef)

// 顶栏滚动后切换为毛玻璃背景
const isScrolled = ref(false)
const onWindowScroll = () => {
  isScrolled.value = window.scrollY > 8
}

const navLinks = [
  { name: () => t('group_list'), path: '/groups', icon: Users },
  { name: () => t('sponsor'), path: '/sponsor', icon: Heart },
  { name: () => t('tutorials'), path: '/tutorials', icon: BookOpen },
  { name: () => t('api_docs'), path: '/api-docs', icon: FileText }
]

const friendLinks = [
  { name: 'NexusMC', url: 'https://www.nexusmc.cn' },
  { name: '柠泽资源站', url: 'https://miawa.cn/' }
]

const easterEggImages = [
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/974d9feef5429ded.jpeg',
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/0b9453f27d4823ef.jpg',
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/8295488fa57aef04.jpeg'
]

const closeEasterEgg = () => {
  showEasterEgg.value = false
}

// 显示模式：浅色 / 深色 / 跟随系统（页脚 tab 切换）
type DisplayMode = 'light' | 'dark' | 'system'
const displayMode = ref<DisplayMode>('system')

const themeOptions: { mode: DisplayMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: t('theme_light') },
  { mode: 'dark', icon: Moon, label: t('theme_dark') },
  { mode: 'system', icon: Monitor, label: t('theme_system') }
]

const applyDisplayMode = (mode: DisplayMode) => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = mode === 'dark' || (mode === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}

const setDisplayMode = (mode: DisplayMode) => {
  displayMode.value = mode
  if (mode === 'system') localStorage.removeItem('display_mode')
  else localStorage.setItem('display_mode', mode)
  applyDisplayMode(mode)
}

// 彩蛋：连点页脚版本号 3 次触发（touch-manipulation 防移动端双击缩放吞点击）
let easterEggClicks = 0
let easterEggTimer: ReturnType<typeof setTimeout> | null = null

const onVersionClick = () => {
  easterEggClicks++
  if (easterEggTimer) clearTimeout(easterEggTimer)
  easterEggTimer = setTimeout(() => {
    easterEggClicks = 0
  }, 2000)
  if (easterEggClicks >= 3) {
    easterEggClicks = 0
    showEasterEgg.value = true
  }
}

onMounted(() => {
  const template = getCurrentPageTemplate(route.name?.toString())
  setPageTitle(template)

  const stored = localStorage.getItem('display_mode')
  displayMode.value = stored === 'dark' || stored === 'light' ? stored : 'system'
  applyDisplayMode(displayMode.value)

  // 未显式设置显示模式时，跟随系统深浅色变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (!localStorage.getItem('display_mode')) {
      applyDisplayMode('system')
    }
  })

  onWindowScroll()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased transition-colors duration-500"
  >
    <header class="sticky top-0 z-30 w-full pointer-events-none">
      <div
        class="pointer-events-auto mx-auto transition-all duration-300 ease-out"
        :class="
          isScrolled
            ? 'mt-3 w-[calc(100%-2rem)] rounded-full border-border/60 bg-background/80 shadow-lg backdrop-blur-md'
            : 'mt-0 w-full rounded-none border border-transparent bg-background'
        "
      >
        <div
          class="flex items-center gap-3 px-4 transition-all duration-300"
          :class="isScrolled ? 'h-12' : 'h-14'"
        >
          <RouterLink to="/" class="flex shrink-0 items-center font-semibold">
            <span class="inline">LogShare.CN</span>
          </RouterLink>

          <nav class="ml-4 hidden items-center gap-1 md:flex">
            <RouterLink
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              class="rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              :class="
                route.path === link.path || (link.path !== '/' && route.path.startsWith(link.path))
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              "
            >
              <component :is="link.icon" weight="duotone" class="mr-1 -mt-0.5 inline h-4 w-4" />
              {{ link.name() }}
            </RouterLink>
          </nav>

          <div class="flex-1" />

          <!-- 主题三态切换：圆角容器 tab，高亮胶囊在选项间平移 -->
          <div
            class="relative flex items-center gap-0.5 rounded-full border border-border/60 bg-background/60 p-0.5"
            role="tablist"
            aria-label="显示模式"
          >
            <span
              aria-hidden="true"
              class="absolute left-0.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-muted-foreground/25 shadow-sm transition-transform duration-300 ease-out"
              :style="{
                transform: `translateX(${themeOptions.findIndex(o => o.mode === displayMode) * 30}px) translateY(-50%)`
              }"
            />
            <button
              v-for="option in themeOptions"
              :key="option.mode"
              role="tab"
              :aria-selected="displayMode === option.mode"
              :aria-label="option.label"
              :title="option.label"
              class="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              :class="
                displayMode === option.mode
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-accent-foreground'
              "
              @click="setDisplayMode(option.mode)"
            >
              <component :is="option.icon" weight="duotone" class="h-3.5 w-3.5" />
            </button>
          </div>

          <LanguageMenu compact class="hidden md:flex" />

          <MobileNav :scrolled="isScrolled" />
        </div>
      </div>
    </header>

    <!-- [&>*]:min-w-0：flex 子项默认 min-width:auto，长内容（如文档页代码块）会把页面撑出横向滚动 -->
    <main class="flex-1 flex flex-col [&>*]:min-w-0">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t bg-muted/20">
      <div class="container mx-auto px-4 py-8">
        <div class="grid gap-8 md:grid-cols-3">
          <!-- 左：品牌简介 + 联系方式 + 版权/服务声明 -->
          <div class="md:col-span-2">
            <p class="text-sm font-semibold">LogShare.CN</p>
            <p class="mt-2 max-w-md text-sm text-muted-foreground">
              {{ t('home_subtitle') }}
            </p>

            <p class="mt-6 text-sm font-semibold">{{ t('footer_contact') }}</p>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              <a
                href="https://qm.qq.com/q/gZ2El58RVe"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
              >
                <MessageCircle weight="duotone" class="h-3.5 w-3.5" />
                QQ 群
              </a>
              <a
                href="https://github.com/NingZeStudio/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
              >
                <Github weight="duotone" class="h-3.5 w-3.5" />
                GitHub
              </a>
            </div>

            <div
              class="mt-6 flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-3"
            >
              <span class="flex items-center gap-2">
                <span>&copy; 2026 LogShare.CN</span>
                <button
                  class="cursor-pointer select-none touch-manipulation transition-colors hover:text-foreground"
                  aria-label="彩蛋"
                  @click="onVersionClick"
                >
                  #{{ DEPLOY_HASH }}
                </button>
              </span>
              <span class="hidden sm:inline text-border">|</span>
              <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{{ t('edgeone_distribution') }}。</span>
                <span>{{ t('waf_protecting') }}</span>
              </span>
            </div>
          </div>

          <!-- 右：友情链接 -->
          <div>
            <p class="text-sm font-semibold">{{ t('friend_links') }}</p>
            <div class="mt-2 flex flex-col gap-2">
              <a
                v-for="link in friendLinks"
                :key="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
              >
                {{ link.name }}
                <ExternalLink weight="duotone" class="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <AppDialog :open="showEasterEgg" width="xl" @close="closeEasterEgg">
      <div class="grid gap-6 p-6">
        <h2 class="text-center text-2xl font-bold">{{ t('easter_egg_title') }}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            v-for="(img, index) in easterEggImages"
            :key="index"
            class="aspect-[3/4] overflow-hidden rounded-lg border bg-muted"
          >
            <img
              :src="img"
              class="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              alt="Secret Reward"
            />
          </div>
        </div>
        <p class="text-center text-sm text-muted-foreground">{{ t('easter_egg_hint') }}</p>
      </div>
    </AppDialog>

    <PwaUpdateToast />
    <PwaInstallPrompt />
    <AnnouncementDialog ref="announcementDialogRef" />
    <WafBlockDialog />
    <ToastHost />
  </div>
</template>

<style>
/* 页面间切换：淡入 + 轻微上滑 */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
