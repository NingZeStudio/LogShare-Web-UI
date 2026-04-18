<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { t } from '@/lib/i18n'
import {
  announcementConfig,
  logUpdateConfigs,
  hasSeenAnnouncement,
  markAnnouncementAsSeen,
  hasSeenLogUpdate,
  markLogUpdateAsSeen,
  resetAnnouncement
} from '@/lib/announcementConfig'

const isOpen = ref(false)
const currentView = ref<'announcement' | 'log-update'>('announcement')
const currentLogUpdate = ref<string | null>(null)

onMounted(() => {
  if (!hasSeenAnnouncement()) {
    setTimeout(() => {
      isOpen.value = true
      currentView.value = 'announcement'
    }, 500)
  }
})

const closeDialog = () => {
  isOpen.value = false
  if (currentView.value === 'announcement') {
    markAnnouncementAsSeen()
  } else if (currentLogUpdate.value) {
    markLogUpdateAsSeen(currentLogUpdate.value)
  }
}

const forceShowAnnouncement = () => {
  resetAnnouncement()
  isOpen.value = true
  currentView.value = 'announcement'
}

const showLogUpdate = (logId: string) => {
  if (!hasSeenLogUpdate(logId)) {
    currentLogUpdate.value = logId
    currentView.value = 'log-update'
    isOpen.value = true
  }
}

const currentLogUpdateConfig = computed(() => {
  if (!currentLogUpdate.value) return null
  return logUpdateConfigs.find((config) => config.logId === currentLogUpdate.value)
})

defineExpose({
  forceShowAnnouncement,
  showLogUpdate
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
        @click.self="closeDialog"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            class="bg-card text-card-foreground rounded-lg shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden relative"
          >
            <div v-if="currentView === 'announcement'" class="p-5 sm:p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-2">
                  <div class="w-1 h-6 bg-primary rounded-full"></div>
                  <h2 class="text-lg font-semibold text-foreground">
                    {{ announcementConfig.title }}
                  </h2>
                </div>
                <button
                  class="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  :aria-label="t('close')"
                  @click="closeDialog"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <div class="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <div class="bg-muted/50 rounded-lg p-4">
                  <p class="whitespace-pre-line leading-relaxed">
                    {{ announcementConfig.content }}
                  </p>
                  <p
                    v-if="announcementConfig.importantText"
                    class="mt-3 font-bold text-red-500"
                  >
                    {{ announcementConfig.importantText }}
                  </p>
                </div>
              </div>

              <div class="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                <p class="text-xs text-muted-foreground">
                  {{ t('announcement_footer') }}
                </p>
              </div>
            </div>

            <div v-else-if="currentView === 'log-update' && currentLogUpdateConfig" class="p-5 sm:p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-2">
                  <div class="w-1 h-6 bg-amber-500 rounded-full"></div>
                  <h2 class="text-lg font-semibold text-foreground">
                    {{ currentLogUpdateConfig.title }}
                  </h2>
                </div>
                <button
                  class="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  :aria-label="t('close')"
                  @click="closeDialog"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <p class="text-sm text-muted-foreground leading-relaxed mb-5">
                {{ currentLogUpdateConfig.description }}
              </p>

              <RouterLink
                :to="`/${currentLogUpdate}`"
                @click="closeDialog"
                class="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg transition-colors text-sm font-medium w-full"
              >
                查看日志
              </RouterLink>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
div[class*='overflow-y-auto'] {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
}

div[class*='overflow-y-auto']::-webkit-scrollbar {
  width: 6px;
}

div[class*='overflow-y-auto']::-webkit-scrollbar-track {
  background: transparent;
}

div[class*='overflow-y-auto']::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.dark div[class*='overflow-y-auto']::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
</style>
