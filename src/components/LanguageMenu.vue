<script setup lang="ts">
import { ref } from 'vue'
import { Languages, ChevronDown } from 'lucide-vue-next'

const showMenu = ref(false)
const currentLang = ref(localStorage.getItem('preferred_language') || 'zh-CN')

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const switchLanguage = (lang: 'zh-CN' | 'zh-TW') => {
  currentLang.value = lang
  localStorage.setItem('preferred_language', lang)
  showMenu.value = false
  window.location.reload()
}
</script>

<template>
  <div class="relative">
    <button
      @click="toggleMenu"
      class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      aria-label="切换语言"
    >
      <Languages class="h-4 w-4" />
      <span>语言</span>
      <ChevronDown class="h-3.5 w-3.5" />
    </button>

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showMenu"
        class="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
      >
        <button
          @click="switchLanguage('zh-CN')"
          class="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
          :class="currentLang === 'zh-CN' ? 'text-primary font-medium' : 'text-muted-foreground'"
        >
          简体中文
        </button>
        <button
          @click="switchLanguage('zh-TW')"
          class="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors border-t border-border"
          :class="currentLang === 'zh-TW' ? 'text-primary font-medium' : 'text-muted-foreground'"
        >
          繁體中文
        </button>
      </div>
    </Transition>

    <!-- 点击外部关闭 -->
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showMenu"
        class="fixed inset-0 z-40"
        @click="showMenu = false"
      />
    </Transition>
  </div>
</template>
