<script setup lang="ts">
import { ref } from 'vue'
import { Menu, X, ChevronRight, Palette, Languages, Heart, Github, BookOpen } from 'lucide-vue-next'
import ThemeSettings from '@/components/ThemeSettings.vue'

const isOpen = ref(false)
const docsOpen = ref(false)
const langOpen = ref(false)
const openSourceOpen = ref(false)
const isThemeSettingsOpen = ref(false)

const toggleNav = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    docsOpen.value = false
    langOpen.value = false
    openSourceOpen.value = false
  }
}

const closeNav = () => {
  isOpen.value = false
}

const toggleDocs = () => {
  docsOpen.value = !docsOpen.value
  if (docsOpen.value) {
    langOpen.value = false
    openSourceOpen.value = false
  }
}

const toggleLang = () => {
  langOpen.value = !langOpen.value
  if (langOpen.value) {
    docsOpen.value = false
    openSourceOpen.value = false
  }
}

const toggleOpenSource = () => {
  openSourceOpen.value = !openSourceOpen.value
  if (openSourceOpen.value) {
    docsOpen.value = false
    langOpen.value = false
  }
}

const switchLanguage = (lang: 'zh-CN' | 'zh-TW') => {
  localStorage.setItem('preferred_language', lang)
  window.location.reload()
}

const currentLang = ref(localStorage.getItem('preferred_language') || 'zh-CN')
</script>

<template>
  <div class="flex items-center gap-1">
    <!-- 主题设置按钮（汉堡菜单旁边） -->
    <button
      class="lg:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
      aria-label="主题设置"
      @click="isThemeSettingsOpen = true"
    >
      <Palette class="h-5 w-5" />
    </button>

    <!-- 汉堡菜单按钮 -->
    <button
      class="lg:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
      aria-label="菜单"
      @click="toggleNav"
    >
      <Menu v-if="!isOpen" class="h-5 w-5" />
      <X v-else class="h-5 w-5" />
    </button>

    <!-- 移动端菜单面板 -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
      >
        <div class="p-2 space-y-1">
          <!-- 教程与文档（二级菜单） -->
          <div class="relative">
            <button
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              @click="toggleDocs"
            >
              <span class="flex items-center gap-2">
                <BookOpen class="h-4 w-4" />
                教程与文档
              </span>
              <ChevronRight
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-90': docsOpen }"
              />
            </button>

            <!-- 二级菜单内容 -->
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-32 opacity-100"
              leave-active-class="transition-all duration-150"
              leave-from-class="max-h-32 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-if="docsOpen" class="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                <RouterLink
                  to="/tutorials"
                  class="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  @click="closeNav"
                >
                  教程中心
                </RouterLink>
                <RouterLink
                  to="/api-docs"
                  class="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  @click="closeNav"
                >
                  API 文档
                </RouterLink>
              </div>
            </Transition>
          </div>

          <!-- 语言切换（二级菜单） -->
          <div class="relative">
            <button
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              @click="toggleLang"
            >
              <span class="flex items-center gap-2">
                <Languages class="h-4 w-4" />
                选择语言
              </span>
              <ChevronRight
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-90': langOpen }"
              />
            </button>

            <!-- 二级菜单内容 -->
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-32 opacity-100"
              leave-active-class="transition-all duration-150"
              leave-from-class="max-h-32 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-if="langOpen" class="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                <button
                  class="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  :class="{ 'text-foreground font-medium': currentLang === 'zh-CN' }"
                  @click="switchLanguage('zh-CN')"
                >
                  简体中文
                </button>
                <button
                  class="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  :class="{ 'text-foreground font-medium': currentLang === 'zh-TW' }"
                  @click="switchLanguage('zh-TW')"
                >
                  繁體中文
                </button>
              </div>
            </Transition>
          </div>

          <!-- 开源地址（二级菜单） -->
          <div class="relative">
            <button
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              @click="toggleOpenSource"
            >
              <span class="flex items-center gap-2">
                <Github class="h-4 w-4" />
                开源地址
              </span>
              <ChevronRight
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-90': openSourceOpen }"
              />
            </button>

            <!-- 二级菜单内容 -->
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-40 opacity-100"
              leave-active-class="transition-all duration-150"
              leave-from-class="max-h-40 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-if="openSourceOpen" class="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                <a
                  href="https://github.com/NingZeStudio/McLogs-Next-UI"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  前端开源地址
                </a>
                <a
                  href="https://github.com/NingZeStudio/LogShare-V1"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  后端开源地址
                </a>
              </div>
            </Transition>
          </div>

          <!-- 赞助支持 -->
          <RouterLink
            to="/sponsor"
            class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
            @click="closeNav"
          >
            <Heart class="h-4 w-4" />
            赞助支持
          </RouterLink>

          <!-- 团队主页 -->
          <a
            href="https://github.com/NingZeStudio/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <Github class="h-4 w-4" />
            团队主页
          </a>
        </div>
      </div>
    </Transition>
  </div>

  <ThemeSettings v-model:open="isThemeSettingsOpen" />
</template>
