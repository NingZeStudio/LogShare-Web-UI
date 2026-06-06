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

const currentTheme = ref('indigo')
const displayMode = ref<'light' | 'dark' | 'system'>('system')
const currentFont = ref('fira_code')

const themes = [
  { id: 'indigo', name: '靛蓝', color: 'bg-indigo-500' },
  { id: 'emerald', name: '翡翠', color: 'bg-emerald-500' },
  { id: 'rose', name: '玫瑰', color: 'bg-rose-500' },
  { id: 'amber', name: '琥珀', color: 'bg-amber-500' },
  { id: 'violet', name: '紫罗兰', color: 'bg-violet-500' },
  { id: 'slate', name: '石墨', color: 'bg-slate-500' }
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
  currentTheme.value = 'indigo'
  displayMode.value = 'system'
  currentFont.value = 'fira_code'

  localStorage.removeItem('theme_color')
  localStorage.removeItem('display_mode')
  localStorage.removeItem(LOCAL_STORAGE_KEYS.FONT_FAMILY)

  applyTheme('indigo')
  applyDisplayMode('system')
  applyFont('fira_code')
}

const applyTheme = (themeId: string) => {
  const isDark = document.documentElement.classList.contains('dark')

  type Palette = {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }

  const palettes: Record<string, { light: Palette; dark: Palette }> = {
    indigo: {
      light: {
        background: '0 0% 100%',
        foreground: '226 57% 12%',
        card: '0 0% 100%',
        cardForeground: '226 57% 12%',
        popover: '0 0% 100%',
        popoverForeground: '226 57% 12%',
        primary: '226 71% 40%',
        primaryForeground: '0 0% 100%',
        secondary: '226 40% 94%',
        secondaryForeground: '226 57% 12%',
        muted: '226 40% 94%',
        mutedForeground: '226 8% 46%',
        accent: '226 40% 94%',
        accentForeground: '226 57% 12%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        border: '226 12% 88%',
        input: '226 12% 88%',
        ring: '226 71% 40%'
      },
      dark: {
        background: '226 57% 6%',
        foreground: '0 0% 95%',
        card: '226 50% 10%',
        cardForeground: '0 0% 95%',
        popover: '226 50% 8%',
        popoverForeground: '0 0% 95%',
        primary: '226 71% 56%',
        primaryForeground: '226 57% 6%',
        secondary: '226 30% 18%',
        secondaryForeground: '0 0% 95%',
        muted: '226 30% 16%',
        mutedForeground: '226 8% 56%',
        accent: '226 30% 18%',
        accentForeground: '0 0% 95%',
        destructive: '0 72% 51%',
        destructiveForeground: '0 0% 95%',
        border: '226 25% 22%',
        input: '226 25% 22%',
        ring: '226 71% 56%'
      }
    },
    emerald: {
      light: {
        background: '0 0% 100%',
        foreground: '160 50% 10%',
        card: '0 0% 100%',
        cardForeground: '160 50% 10%',
        popover: '0 0% 100%',
        popoverForeground: '160 50% 10%',
        primary: '160 70% 28%',
        primaryForeground: '0 0% 100%',
        secondary: '150 35% 92%',
        secondaryForeground: '160 50% 10%',
        muted: '150 35% 92%',
        mutedForeground: '155 6% 46%',
        accent: '150 35% 92%',
        accentForeground: '160 50% 10%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        border: '155 15% 86%',
        input: '155 15% 86%',
        ring: '160 70% 28%'
      },
      dark: {
        background: '160 40% 5%',
        foreground: '0 0% 95%',
        card: '160 35% 8%',
        cardForeground: '0 0% 95%',
        popover: '160 35% 6%',
        popoverForeground: '0 0% 95%',
        primary: '160 70% 42%',
        primaryForeground: '160 40% 5%',
        secondary: '160 25% 16%',
        secondaryForeground: '0 0% 95%',
        muted: '160 25% 14%',
        mutedForeground: '155 8% 56%',
        accent: '160 25% 16%',
        accentForeground: '0 0% 95%',
        destructive: '0 72% 51%',
        destructiveForeground: '0 0% 95%',
        border: '160 20% 20%',
        input: '160 20% 20%',
        ring: '160 70% 42%'
      }
    },
    rose: {
      light: {
        background: '0 0% 100%',
        foreground: '340 40% 12%',
        card: '0 0% 100%',
        cardForeground: '340 40% 12%',
        popover: '0 0% 100%',
        popoverForeground: '340 40% 12%',
        primary: '346 77% 42%',
        primaryForeground: '0 0% 100%',
        secondary: '345 30% 94%',
        secondaryForeground: '340 40% 12%',
        muted: '345 30% 94%',
        mutedForeground: '340 6% 46%',
        accent: '345 30% 94%',
        accentForeground: '340 40% 12%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        border: '345 12% 88%',
        input: '345 12% 88%',
        ring: '346 77% 42%'
      },
      dark: {
        background: '340 30% 5%',
        foreground: '0 0% 95%',
        card: '340 25% 8%',
        cardForeground: '0 0% 95%',
        popover: '340 25% 6%',
        popoverForeground: '0 0% 95%',
        primary: '346 77% 56%',
        primaryForeground: '340 30% 5%',
        secondary: '340 22% 16%',
        secondaryForeground: '0 0% 95%',
        muted: '340 22% 14%',
        mutedForeground: '340 8% 56%',
        accent: '340 22% 16%',
        accentForeground: '0 0% 95%',
        destructive: '0 72% 51%',
        destructiveForeground: '0 0% 95%',
        border: '340 18% 20%',
        input: '340 18% 20%',
        ring: '346 77% 56%'
      }
    },
    amber: {
      light: {
        background: '0 0% 100%',
        foreground: '25 60% 12%',
        card: '0 0% 100%',
        cardForeground: '25 60% 12%',
        popover: '0 0% 100%',
        popoverForeground: '25 60% 12%',
        primary: '25 90% 42%',
        primaryForeground: '0 0% 100%',
        secondary: '30 35% 93%',
        secondaryForeground: '25 60% 12%',
        muted: '30 35% 93%',
        mutedForeground: '25 8% 46%',
        accent: '30 35% 93%',
        accentForeground: '25 60% 12%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        border: '30 16% 86%',
        input: '30 16% 86%',
        ring: '25 90% 42%'
      },
      dark: {
        background: '25 40% 5%',
        foreground: '0 0% 95%',
        card: '25 35% 8%',
        cardForeground: '0 0% 95%',
        popover: '25 35% 6%',
        popoverForeground: '0 0% 95%',
        primary: '25 90% 52%',
        primaryForeground: '25 40% 5%',
        secondary: '25 28% 16%',
        secondaryForeground: '0 0% 95%',
        muted: '25 28% 14%',
        mutedForeground: '25 8% 56%',
        accent: '25 28% 16%',
        accentForeground: '0 0% 95%',
        destructive: '0 72% 51%',
        destructiveForeground: '0 0% 95%',
        border: '25 22% 20%',
        input: '25 22% 20%',
        ring: '25 90% 52%'
      }
    },
    violet: {
      light: {
        background: '0 0% 100%',
        foreground: '260 50% 12%',
        card: '0 0% 100%',
        cardForeground: '260 50% 12%',
        popover: '0 0% 100%',
        popoverForeground: '260 50% 12%',
        primary: '262 83% 52%',
        primaryForeground: '0 0% 100%',
        secondary: '260 30% 94%',
        secondaryForeground: '260 50% 12%',
        muted: '260 30% 94%',
        mutedForeground: '260 6% 46%',
        accent: '260 30% 94%',
        accentForeground: '260 50% 12%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        border: '260 16% 88%',
        input: '260 16% 88%',
        ring: '262 83% 52%'
      },
      dark: {
        background: '260 40% 5%',
        foreground: '0 0% 95%',
        card: '260 30% 8%',
        cardForeground: '0 0% 95%',
        popover: '260 30% 6%',
        popoverForeground: '0 0% 95%',
        primary: '262 83% 65%',
        primaryForeground: '260 40% 5%',
        secondary: '260 25% 16%',
        secondaryForeground: '0 0% 95%',
        muted: '260 25% 14%',
        mutedForeground: '260 8% 56%',
        accent: '260 25% 16%',
        accentForeground: '0 0% 95%',
        destructive: '0 72% 51%',
        destructiveForeground: '0 0% 95%',
        border: '260 20% 20%',
        input: '260 20% 20%',
        ring: '262 83% 65%'
      }
    },
    slate: {
      light: {
        background: '0 0% 100%',
        foreground: '215 28% 12%',
        card: '0 0% 100%',
        cardForeground: '215 28% 12%',
        popover: '0 0% 100%',
        popoverForeground: '215 28% 12%',
        primary: '215 25% 27%',
        primaryForeground: '0 0% 100%',
        secondary: '215 20% 93%',
        secondaryForeground: '215 28% 12%',
        muted: '215 20% 93%',
        mutedForeground: '215 8% 46%',
        accent: '215 20% 93%',
        accentForeground: '215 28% 12%',
        destructive: '0 84% 60%',
        destructiveForeground: '0 0% 100%',
        border: '215 16% 86%',
        input: '215 16% 86%',
        ring: '215 25% 27%'
      },
      dark: {
        background: '215 25% 6%',
        foreground: '0 0% 95%',
        card: '215 22% 10%',
        cardForeground: '0 0% 95%',
        popover: '215 22% 8%',
        popoverForeground: '0 0% 95%',
        primary: '215 20% 65%',
        primaryForeground: '215 25% 6%',
        secondary: '215 18% 18%',
        secondaryForeground: '0 0% 95%',
        muted: '215 18% 16%',
        mutedForeground: '215 8% 56%',
        accent: '215 18% 18%',
        accentForeground: '0 0% 95%',
        destructive: '0 72% 51%',
        destructiveForeground: '0 0% 95%',
        border: '215 15% 22%',
        input: '215 15% 22%',
        ring: '215 20% 65%'
      }
    }
  }

  const palette = palettes[themeId]?.light ? palettes[themeId] : palettes.indigo!
  const colors = isDark ? palette.dark : palette.light

  const root = document.documentElement
  root.style.setProperty('--background', colors.background)
  root.style.setProperty('--foreground', colors.foreground)
  root.style.setProperty('--card', colors.card)
  root.style.setProperty('--card-foreground', colors.cardForeground)
  root.style.setProperty('--popover', colors.popover)
  root.style.setProperty('--popover-foreground', colors.popoverForeground)
  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-foreground', colors.primaryForeground)
  root.style.setProperty('--secondary', colors.secondary)
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground)
  root.style.setProperty('--muted', colors.muted)
  root.style.setProperty('--muted-foreground', colors.mutedForeground)
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--accent-foreground', colors.accentForeground)
  root.style.setProperty('--destructive', colors.destructive)
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground)
  root.style.setProperty('--border', colors.border)
  root.style.setProperty('--input', colors.input)
  root.style.setProperty('--ring', colors.ring)
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

  const savedTheme = localStorage.getItem('theme_color') || 'indigo'
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
  const savedThemeRaw = localStorage.getItem('theme_color') || 'indigo'

  const migrationMap: Record<string, string> = {
    ink: 'slate',
    ocean: 'indigo',
    lavender: 'violet',
    forest: 'emerald',
    sunset: 'amber',
    sakura: 'rose'
  }
  const savedTheme = migrationMap[savedThemeRaw] || savedThemeRaw
  const savedDisplayMode = localStorage.getItem('display_mode') as
    | 'light'
    | 'dark'
    | 'system'
    | null
  const savedFont = localStorage.getItem(LOCAL_STORAGE_KEYS.FONT_FAMILY)

  if (savedTheme) {
    currentTheme.value = savedTheme
    if (migrationMap[savedThemeRaw]) {
      localStorage.setItem('theme_color', savedTheme)
    }
  }
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
