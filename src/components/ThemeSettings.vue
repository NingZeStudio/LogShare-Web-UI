<template>
  <Teleport to="body">
    <Transition name="fade" appear>
      <div
        v-if="open"
        class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="fixed inset-y-0 right-0 w-[300px] sm:w-[400px] bg-card border-l shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 z-[101]"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2 font-semibold">
                <Palette class="h-5 w-5" />
                <span>主题设置</span>
              </div>
              <button
                class="p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                @click="close"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="space-y-6">
              <div class="space-y-3">
                <h4 class="text-sm font-medium text-muted-foreground">{{ t('theme') }}色</h4>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    v-for="theme in themes"
                    :key="theme.id"
                    class="relative flex flex-col items-center gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    :class="currentTheme === theme.id ? 'border-primary bg-muted' : 'border-border'"
                    @click="setTheme(theme.id)"
                  >
                    <div
                      class="h-8 w-8 rounded-full shadow-sm"
                      :class="[
                        theme.color,
                        currentTheme === theme.id ? 'ring-2 ring-primary ring-offset-2' : ''
                      ]"
                    />
                    <span class="text-xs font-medium">{{ theme.name }}</span>
                  </button>
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="text-sm font-medium text-muted-foreground">{{ t('font_family') }}</h4>
                <div class="relative">
                  <select
                    v-model="currentFont"
                    class="w-full appearance-none bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    @change="setFont(currentFont)"
                  >
                    <option value="maple_mono">{{ t('font_maple_mono') }}</option>
                    <option value="fira_code">{{ t('font_fira_code') }}</option>
                  </select>
                  <ChevronDown
                    class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  />
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="text-sm font-medium text-muted-foreground">显示模式</h4>
                <div class="flex gap-2">
                  <button
                    class="flex-1 py-2 px-3 rounded-md border-2 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                    :class="
                      displayMode === 'light'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    "
                    @click="setDisplayMode('light')"
                  >
                    <Sun class="h-4 w-4" />
                  </button>
                  <button
                    class="flex-1 py-2 px-3 rounded-md border-2 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                    :class="
                      displayMode === 'dark'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    "
                    @click="setDisplayMode('dark')"
                  >
                    <Moon class="h-4 w-4" />
                  </button>
                  <button
                    class="flex-1 py-2 px-3 rounded-md border-2 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                    :class="
                      displayMode === 'system'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    "
                    @click="setDisplayMode('system')"
                  >
                    <Monitor class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div class="pt-4 border-t">
                <button
                  class="w-full py-2 px-3 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
                  @click="resetSettings"
                >
                  重置主题设置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Palette, Sun, Moon, Monitor, X, ChevronDown } from 'lucide-vue-next'
import { t } from '@/lib/i18n'
import { LOCAL_STORAGE_KEYS } from '@/lib/localStorage'

defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open'])

const close = () => {
  emit('update:open', false)
}

const currentTheme = ref('ocean')
const displayMode = ref<'light' | 'dark' | 'system'>('system')
const currentFont = ref('fira_code')

const themes = [
  { id: 'ink', name: '水墨', color: 'bg-zinc-500' },
  { id: 'ocean', name: '海洋', color: 'bg-blue-500' },
  { id: 'lavender', name: '薰衣草', color: 'bg-purple-500' },
  { id: 'forest', name: '森林', color: 'bg-green-500' },
  { id: 'sunset', name: '日落', color: 'bg-orange-500' },
  { id: 'sakura', name: '樱花', color: 'bg-pink-500' }
]

const setTheme = (themeId: string) => {
  currentTheme.value = themeId
  applyTheme(themeId)
  localStorage.setItem('theme_color', themeId)
}

const setDisplayMode = (mode: 'light' | 'dark' | 'system') => {
  displayMode.value = mode
  localStorage.setItem('display_mode', mode)
  applyDisplayMode(mode)
}

const setFont = (fontId: string) => {
  currentFont.value = fontId
  applyFont(fontId)
  localStorage.setItem(LOCAL_STORAGE_KEYS.FONT_FAMILY, fontId)
}

const resetSettings = () => {
  currentTheme.value = 'ocean'
  displayMode.value = 'system'
  currentFont.value = 'fira_code'

  localStorage.removeItem('theme_color')
  localStorage.removeItem('display_mode')
  localStorage.removeItem(LOCAL_STORAGE_KEYS.FONT_FAMILY)

  applyTheme('ocean')
  applyDisplayMode('system')
  applyFont('fira_code')
}

const applyTheme = (themeId: string) => {
  const isDark = document.documentElement.classList.contains('dark')

  const themeColors: Record<
    string,
    { primary: string; accent: string; primaryDark?: string; accentDark?: string }
  > = {
    ink: {
      primary: '0 0% 20%',
      accent: '0 0% 90%',
      primaryDark: '0 0% 80%',
      accentDark: '0 0% 25%'
    },
    ocean: {
      primary: '204 94% 38%',
      accent: '199 89% 48%',
      primaryDark: '204 94% 50%',
      accentDark: '199 89% 60%'
    },
    lavender: {
      primary: '260 60% 65%',
      accent: '270 50% 80%',
      primaryDark: '260 60% 75%',
      accentDark: '270 50% 85%'
    },
    forest: {
      primary: '142 76% 36%',
      accent: '150 60% 40%',
      primaryDark: '142 76% 50%',
      accentDark: '150 60% 55%'
    },
    sunset: {
      primary: '14 90% 53%',
      accent: '30 90% 60%',
      primaryDark: '14 90% 65%',
      accentDark: '30 90% 70%'
    },
    sakura: {
      primary: '330 80% 70%',
      accent: '340 70% 85%',
      primaryDark: '330 80% 80%',
      accentDark: '340 70% 90%'
    }
  }

  const colors = themeColors[themeId] || themeColors.ocean
  const primary = isDark && colors!.primaryDark ? colors!.primaryDark : colors!.primary
  const accent = isDark && colors!.accentDark ? colors!.accentDark : colors!.accent

  document.documentElement.style.setProperty('--primary', primary)
  document.documentElement.style.setProperty('--accent', accent)
}

const applyDisplayMode = (mode: 'light' | 'dark' | 'system') => {
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  const savedTheme = localStorage.getItem('theme_color') || 'ocean'
  applyTheme(savedTheme)
}

const applyFont = (fontId: string) => {
  const fontMap: Record<string, { mono: string; sans: string }> = {
    maple_mono: {
      mono: 'Maple Mono, Fira Code, monospace',
      sans: 'Maple Mono, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, Source Han Sans SC, sans-serif'
    },
    fira_code: {
      mono: 'Fira Code, Maple Mono, monospace',
      sans: 'Fira Code, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, Source Han Sans SC, sans-serif'
    }
  }
  const fonts = fontMap[fontId as keyof typeof fontMap] ?? fontMap.maple_mono
  document.documentElement.style.setProperty('--font-mono', fonts!.mono)
  document.documentElement.style.setProperty('--font-sans', fonts!.sans)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme_color')
  const savedDisplayMode = localStorage.getItem('display_mode') as
    | 'light'
    | 'dark'
    | 'system'
    | null
  const savedFont = localStorage.getItem(LOCAL_STORAGE_KEYS.FONT_FAMILY)

  if (savedTheme) currentTheme.value = savedTheme
  if (savedDisplayMode) displayMode.value = savedDisplayMode
  if (savedFont) currentFont.value = savedFont

  applyTheme(currentTheme.value)
  applyDisplayMode(displayMode.value)
  applyFont(currentFont.value || 'fira_code')
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
