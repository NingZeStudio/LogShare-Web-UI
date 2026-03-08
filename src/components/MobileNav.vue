<script setup lang="ts">
import { ref } from 'vue'
import { Menu, X, ChevronRight, Palette, Languages, Heart } from 'lucide-vue-next'
import ThemeSettings from '@/components/ThemeSettings.vue'

const isOpen = ref(false)
const docsOpen = ref(false)
const langOpen = ref(false)
const isThemeSettingsOpen = ref(false)

const toggleNav = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    docsOpen.value = false
    langOpen.value = false
  }
}

const closeNav = () => {
  isOpen.value = false
}

const toggleDocs = () => {
  docsOpen.value = !docsOpen.value
  if (docsOpen.value) {
    langOpen.value = false
  }
}

const toggleLang = () => {
  langOpen.value = !langOpen.value
  if (langOpen.value) {
    docsOpen.value = false
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
      @click="isThemeSettingsOpen = true"
      class="lg:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
      aria-label="主题设置"
    >
      <Palette class="h-5 w-5" />
    </button>

    <!-- 汉堡菜单按钮 -->
    <button
      @click="toggleNav"
      class="lg:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
      aria-label="菜单"
    >
      <Menu v-if="!isOpen" class="h-5 w-5" />
      <X v-else class="h-5 w-5" />
    </button>

    <!-- 移动端菜单面板 -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
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
              @click="toggleDocs"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <span>教程与文档</span>
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
                  @click="closeNav"
                  class="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  教程中心
                </RouterLink>
                <RouterLink
                  to="/api-docs"
                  @click="closeNav"
                  class="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  API 文档
                </RouterLink>
              </div>
            </Transition>
          </div>

          <!-- 语言切换（二级菜单） -->
          <div class="relative">
            <button
              @click="toggleLang"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
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
                  @click="switchLanguage('zh-CN')"
                  class="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  :class="{ 'text-foreground font-medium': currentLang === 'zh-CN' }"
                >
                  简体中文
                </button>
                <button
                  @click="switchLanguage('zh-TW')"
                  class="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  :class="{ 'text-foreground font-medium': currentLang === 'zh-TW' }"
                >
                  繁體中文
                </button>
              </div>
            </Transition>
          </div>

          <!-- 赞助支持 -->
          <RouterLink
            to="/sponsor"
            @click="closeNav"
            class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <Heart class="h-4 w-4" />
            赞助支持
          </RouterLink>

          <!-- 其他菜单项 -->
          <RouterLink
            to="/imprint"
            @click="closeNav"
            class="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            法律声明
          </RouterLink>
          <RouterLink
            to="/privacy"
            @click="closeNav"
            class="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            隐私政策
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>

  <ThemeSettings v-model:open="isThemeSettingsOpen" />
</template>
