<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { t } from '@/lib/i18n'
import AppButton from '@/components/ui/AppButton.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
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
  return logUpdateConfigs.find(config => config.logId === currentLogUpdate.value)
})

defineExpose({
  forceShowAnnouncement,
  showLogUpdate
})
</script>

<template>
  <AppDialog
    :open="isOpen"
    width="md"
    :aria-label="currentView === 'announcement' ? announcementConfig.title : '日志更新提示'"
    @close="closeDialog"
  >
    <div v-if="currentView === 'announcement'" class="p-5 sm:p-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-6 w-1 rounded-full bg-primary"></div>
          <h2 class="text-lg font-semibold text-foreground">{{ announcementConfig.title }}</h2>
        </div>
      </div>

      <div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <div class="rounded-lg bg-muted/50 p-4">
          <p class="leading-relaxed whitespace-pre-line">
            {{ announcementConfig.content }}
          </p>
          <p v-if="announcementConfig.importantText" class="mt-3 font-bold text-red-500">
            {{ announcementConfig.importantText }}
          </p>
        </div>
      </div>

      <div v-if="announcementConfig.links?.length" class="mt-4 flex flex-wrap gap-2">
        <a
          v-for="(link, index) in announcementConfig.links"
          :key="index"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {{ link.label }}
        </a>
      </div>

      <div class="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
        <p class="text-xs text-muted-foreground">
          {{ t('announcement_footer') }}
        </p>
      </div>
    </div>

    <div v-else-if="currentView === 'log-update' && currentLogUpdateConfig" class="p-5 sm:p-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-6 w-1 rounded-full bg-amber-500"></div>
          <h2 class="text-lg font-semibold text-foreground">
            {{ currentLogUpdateConfig.title }}
          </h2>
        </div>
      </div>

      <p class="mb-5 text-sm leading-relaxed text-muted-foreground">
        {{ currentLogUpdateConfig.description }}
      </p>

      <AppButton as="router-link" class="w-full" :to="`/${currentLogUpdate}`" @click="closeDialog">
        查看日志
      </AppButton>
    </div>
  </AppDialog>
</template>
