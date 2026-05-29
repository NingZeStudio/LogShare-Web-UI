<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, X, Heart, BookOpen, FileText, Github, Languages } from 'lucide-vue-next'

const route = useRoute()
const isOpen = ref(false)
const currentLang = ref(localStorage.getItem('preferred_language') || 'zh-CN')

const toggleNav = () => {
  isOpen.value = !isOpen.value
}

const closeNav = () => {
  isOpen.value = false
}

const switchLanguage = (lang: 'zh-CN' | 'zh-TW') => {
  localStorage.setItem('preferred_language', lang)
  window.location.reload()
}

const navLinks = [
  { name: '赞助支持', path: '/sponsor', icon: Heart },
  { name: '教程中心', path: '/tutorials', icon: BookOpen },
  { name: 'API 文档', path: '/api-docs', icon: FileText }
]
</script>

<template>
  <div class="relative md:hidden">
    <button
      class="rounded-md p-2 transition-colors hover:bg-accent"
      aria-label="菜单"
      @click="toggleNav"
    >
      <Menu v-if="!isOpen" class="h-5 w-5" />
      <X v-else class="h-5 w-5" />
    </button>

    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-150"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-lg"
      >
        <div class="space-y-0.5 p-1.5">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            :class="
              route.path === link.path || (link.path !== '/' && route.path.startsWith(link.path))
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
            "
            @click="closeNav"
          >
            <component :is="link.icon" class="h-4 w-4" />
            {{ link.name }}
          </RouterLink>

          <div class="border-t my-1" />

          <div class="px-3 py-2 space-y-1.5">
            <div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Languages class="h-3.5 w-3.5" />
              语言
            </div>
            <div class="flex gap-1">
              <button
                class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                :class="
                  currentLang === 'zh-CN'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                "
                @click="switchLanguage('zh-CN')"
              >
                简体中文
              </button>
              <button
                class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                :class="
                  currentLang === 'zh-TW'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                "
                @click="switchLanguage('zh-TW')"
              >
                繁體中文
              </button>
            </div>
          </div>

          <div class="border-t my-1" />

          <a
            href="https://github.com/NingZeStudio/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            @click="closeNav"
          >
            <Github class="h-4 w-4" />
            团队主页
          </a>
          <a
            href="https://github.com/NingZeStudio/McLogs-Next-UI"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            @click="closeNav"
          >
            <Github class="h-4 w-4" />
            前端开源
          </a>
          <a
            href="https://github.com/NingZeStudio/LogShare-V1"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            @click="closeNav"
          >
            <Github class="h-4 w-4" />
            后端开源
          </a>
        </div>
      </div>
    </Transition>
  </div>
</template>
