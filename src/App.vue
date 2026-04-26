<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { X, Palette, Heart, ChevronDown, Github } from 'lucide-vue-next'
import PwaUpdateToast from '@/components/PwaUpdateToast.vue'
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
import MobileNav from '@/components/MobileNav.vue'
import ThemeSettings from '@/components/ThemeSettings.vue'
import LanguageMenu from '@/components/LanguageMenu.vue'
import { setPageTitle, getCurrentPageTemplate } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'

const showEasterEgg = ref(false)
const isThemeSettingsOpen = ref(false)
const showOpenSourceMenu = ref(false)
const announcementDialogRef = ref<InstanceType<typeof AnnouncementDialog> | null>(null)

provide('announcementDialog', announcementDialogRef)

const easterEggImages = [
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/974d9feef5429ded.jpeg',
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/0b9453f27d4823ef.jpg',
  'https://fastly.jsdelivr.net/gh/qitry/Blog-Static-Resource@main/images/8295488fa57aef04.jpeg'
]

const closeEasterEgg = () => {
  showEasterEgg.value = false
}

onMounted(() => {
  const route = useRoute()
  const template = getCurrentPageTemplate(route.name?.toString())
  setPageTitle(template)
})
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased transition-colors duration-500"
  >
    <header class="border-b bg-card/80 sticky top-0 z-40 w-full backdrop-blur-xl shadow-sm">
      <div class="w-full px-4 h-16 flex items-center justify-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 font-bold text-xl">
          <span class="text-primary">LogShare.CN</span
          ><sup class="text-xs text-muted-foreground">v1.5.0</sup>
        </RouterLink>

        <!-- 中间导航链接 -->
        <nav class="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <RouterLink
            to="/sponsor"
            class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Heart class="h-4 w-4" />
            {{ t('sponsor') }}
          </RouterLink>

          <RouterLink
            to="/tutorials"
            class="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            {{ t('tutorials') }}
          </RouterLink>
          <RouterLink
            to="/api-docs"
            class="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            {{ t('api_docs') }}
          </RouterLink>

          <!-- 团队主页 -->
          <a
            href="https://github.com/NingZeStudio/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Github class="h-4 w-4" />
            {{ t('team_homepage') }}
          </a>

          <!-- 开源地址二级菜单 -->
          <div
            class="relative"
            @mouseenter="showOpenSourceMenu = true"
            @mouseleave="showOpenSourceMenu = false"
          >
            <button
              class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Github class="h-4 w-4" />
              {{ t('open_source') }}
              <ChevronDown
                class="h-3.5 w-3.5 transition-transform"
                :class="{ 'rotate-180': showOpenSourceMenu }"
              />
            </button>

            <!-- 二级菜单下拉 -->
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-show="showOpenSourceMenu"
                class="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
              >
                <a
                  href="https://github.com/NingZeStudio/McLogs-Next-UI"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <span class="font-medium">{{ t('frontend_repo') }}</span>
                </a>
                <a
                  href="https://github.com/NingZeStudio/LogShare-V1"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors border-t border-border"
                >
                  <span class="font-medium">{{ t('backend_repo') }}</span>
                </a>
              </div>
            </Transition>
          </div>
        </nav>

        <!-- 右侧工具按钮 -->
        <div class="hidden lg:flex items-center gap-1 ml-auto">
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            aria-label="主题设置"
            @click="isThemeSettingsOpen = true"
          >
            <Palette class="h-4 w-4" />
            {{ t('theme') }}
          </button>
          <LanguageMenu />
        </div>

        <!-- 移动端菜单 -->
        <MobileNav />
      </div>
    </header>

    <main class="flex-1">
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
          <span>v1.5.0</span>
          <span class="hidden sm:inline">|</span>
          <a
            href="https://qm.qq.com/q/RNnWR2HhOS"
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
