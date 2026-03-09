<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { X, Palette, Heart } from 'lucide-vue-next'
import PwaUpdateToast from '@/components/PwaUpdateToast.vue'
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
import MobileNav from '@/components/MobileNav.vue'
import ThemeSettings from '@/components/ThemeSettings.vue'
import LanguageMenu from '@/components/LanguageMenu.vue'
import { setPageTitle, getCurrentPageTemplate } from '@/lib/pageTitle'

const showEasterEgg = ref(false)
const isThemeSettingsOpen = ref(false)

const easterEggImages = [
  'https://cdn.zeinklab.com/myfile/images/974d9feef5429ded.jpeg',
  'https://cdn.zeinklab.com/myfile/images/0b9453f27d4823ef.jpg',
  'https://cdn.zeinklab.com/myfile/images/8295488fa57aef04.jpeg'
]

const closeEasterEgg = () => {
  showEasterEgg.value = false
}

onMounted(() => {
  const route = useRoute();
  const template = getCurrentPageTemplate(route.name?.toString());
  setPageTitle(template);
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased transition-colors duration-500">
    <header class="border-b bg-card/80 sticky top-0 z-40 w-full backdrop-blur-xl shadow-sm">
      <div class="w-full px-4 h-16 flex items-center justify-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 font-bold text-xl">
          <span class="text-primary">LogShare.CN</span><sup class="text-xs text-muted-foreground">v1.3.0 RC1</sup>
        </RouterLink>

        <!-- 中间导航链接 -->
        <nav class="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <RouterLink to="/sponsor" class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Heart class="h-4 w-4" />
            赞助支持
          </RouterLink>
          <RouterLink to="/tutorials" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            教程中心
          </RouterLink>
          <RouterLink to="/api-docs" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            API 文档
          </RouterLink>
        </nav>

        <!-- 右侧工具按钮 -->
        <div class="hidden lg:flex items-center gap-1 ml-auto">
          <button
            @click="isThemeSettingsOpen = true"
            class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="主题设置"
          >
            <Palette class="h-4 w-4" />
            主题
          </button>
          <LanguageMenu />
        </div>

        <!-- 移动端菜单 -->
        <MobileNav />
      </div>
    </header>

    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t py-4 bg-muted/20">
      <div class="container mx-auto px-4 flex flex-col items-center gap-3 text-xs text-muted-foreground">
        <div class="flex flex-wrap items-center justify-center gap-3">
          <span>&copy; 2026 LogShare.CN</span>
          <span class="hidden sm:inline">|</span>
          <span>v1.3.0 RC1</span>
          <span class="hidden sm:inline">|</span>
          <a
            href="https://qm.qq.com/q/XoXSt8askA"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary transition-colors"
          >
            加入群聊【梦泽闲聊小窝】
          </a>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink to="/sponsor" class="hover:underline transition-colors">赞助支持</RouterLink>
          <RouterLink to="/imprint" class="hover:underline transition-colors">法律声明</RouterLink>
          <RouterLink to="/privacy" class="hover:underline transition-colors">隐私政策</RouterLink>
        </div>
      </div>
    </footer>

    <div v-if="showEasterEgg" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click.self="closeEasterEgg">
      <div class="bg-card border text-card-foreground rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-300">
        <button @click="closeEasterEgg" class="absolute right-4 top-4 p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors z-10">
          <X class="h-6 w-6" />
        </button>
        <div class="p-6 grid gap-6">
          <h2 class="text-2xl font-bold text-center">私货</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="(img, index) in easterEggImages" :key="index" class="aspect-[3/4] rounded-lg overflow-hidden border bg-muted">
              <img :src="img" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="Secret Reward" />
            </div>
          </div>
          <p class="text-center text-muted-foreground text-sm">这些是给最细心的探索者的特别奖励~</p>
        </div>
      </div>
    </div>

    <ThemeSettings v-model:open="isThemeSettingsOpen" />

    <PwaUpdateToast />

    <PwaInstallPrompt />

    <AnnouncementDialog />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
