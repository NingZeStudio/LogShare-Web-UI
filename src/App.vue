<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { Heart, BookOpen, FileText, Github, Palette, Sun, Moon, X } from 'lucide-vue-next'
import PwaUpdateToast from '@/components/PwaUpdateToast.vue'
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
import MobileNav from '@/components/MobileNav.vue'
import ThemeSettings from '@/components/ThemeSettings.vue'
import LanguageMenu from '@/components/LanguageMenu.vue'
import { setPageTitle, getCurrentPageTemplate } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'

const route = useRoute()
const isDark = ref(false)
const isThemeSettingsOpen = ref(false)
const showEasterEgg = ref(false)
const announcementDialogRef = ref<InstanceType<typeof AnnouncementDialog> | null>(null)

provide('announcementDialog', announcementDialogRef)

const navLinks = [
  { name: () => t('sponsor'), path: '/sponsor', icon: Heart },
  { name: () => t('tutorials'), path: '/tutorials', icon: BookOpen },
  { name: () => t('api_docs'), path: '/api-docs', icon: FileText }
]

const easterEggImages = [
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/974d9feef5429ded.jpeg',
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/0b9453f27d4823ef.jpg',
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/8295488fa57aef04.jpeg'
]

const closeEasterEgg = () => {
  showEasterEgg.value = false
}

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('display_mode', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const template = getCurrentPageTemplate(route.name?.toString())
  setPageTitle(template)

  const stored = localStorage.getItem('display_mode')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = stored === 'dark' || (!stored && prefersDark)
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased transition-colors duration-500"
  >
    <header
      class="sticky top-3 z-30 mx-auto w-[calc(100%-2rem)] max-w-6xl rounded-xl border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex h-14 items-center gap-2 px-3 lg:h-[60px] lg:gap-3 lg:px-5">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2 font-semibold">
          <img src="/img/favicon.ico" alt="LogShare.CN" class="h-7 w-7 rounded object-cover" />
          <span class="inline"
            >LogShare.CN<sup class="text-xs text-muted-foreground ml-0.5">v1.5.1</sup></span
          >
        </RouterLink>

        <nav class="ml-4 hidden items-center gap-0.5 md:flex">
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
            <component :is="link.icon" class="inline h-4 w-4 mr-1 -mt-0.5" />
            {{ link.name() }}
          </RouterLink>
        </nav>

        <div class="flex-1" />

        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="切换深色模式"
          @click="toggleDark"
        >
          <Sun v-if="!isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>

        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          @click="isThemeSettingsOpen = true"
          aria-label="主题设置"
        >
          <Palette class="h-4 w-4" />
        </button>

        <button
          class="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="主题设置"
          @click="isThemeSettingsOpen = true"
        >
          <Palette class="h-4 w-4" />
        </button>

        <LanguageMenu compact class="hidden md:flex" />

        <a
          href="https://github.com/NingZeStudio/"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="GitHub"
        >
          <Github class="h-4 w-4" />
        </a>

        <MobileNav />
      </div>
    </header>

    <main class="flex-1 pt-2 lg:pt-4">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in" appear>
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t py-4 bg-muted/20">
      <div
        class="container mx-auto px-4 flex flex-col items-center gap-3 text-xs text-muted-foreground"
      >
        <div class="flex flex-wrap items-center justify-center gap-3">
          <span>&copy; 2026 LogShare.CN</span>
          <span class="hidden sm:inline">|</span>
          <span>v1.5.1</span>
          <span class="hidden sm:inline">|</span>
          <a
            href="https://qm.qq.com/q/FOGt99aayY"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary transition-colors"
          >
            {{ t('join_qq_group') }}
          </a>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink to="/sponsor" class="hover:underline transition-colors">{{
            t('sponsor')
          }}</RouterLink>
          <a
            href="https://github.com/NingZeStudio/"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline transition-colors"
          >
            {{ t('team_homepage') }}
          </a>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <span>{{ t('friend_links') }}:</span>
          <a
            href="https://www.nexusmc.cn"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary hover:underline transition-colors"
          >
            NexusMC
          </a>
        </div>
      </div>
    </footer>

    <div
      v-if="showEasterEgg"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      @click.self="closeEasterEgg"
    >
      <div
        class="bg-card border text-card-foreground rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-300"
      >
        <button
          class="absolute right-4 top-4 p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors z-10"
          @click="closeEasterEgg"
        >
          <X class="h-6 w-6" />
        </button>
        <div class="p-6 grid gap-6">
          <h2 class="text-2xl font-bold text-center">{{ t('easter_egg_title') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="(img, index) in easterEggImages"
              :key="index"
              class="aspect-[3/4] rounded-lg overflow-hidden border bg-muted"
            >
              <img
                :src="img"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                alt="Secret Reward"
              />
            </div>
          </div>
          <p class="text-center text-muted-foreground text-sm">{{ t('easter_egg_hint') }}</p>
        </div>
      </div>
    </div>

    <ThemeSettings v-model:open="isThemeSettingsOpen" />
    <PwaUpdateToast />
    <PwaInstallPrompt />
    <AnnouncementDialog ref="announcementDialogRef" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active,
.fade-enter-active.appear,
.fade-appear-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-appear-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
