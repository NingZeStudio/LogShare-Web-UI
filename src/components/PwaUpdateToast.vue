<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { PhX as X, PhArrowsClockwise as RefreshCw } from '@phosphor-icons/vue'
import AppButton from '@/components/ui/AppButton.vue'

const showUpdateToast = ref(false)
const updateMessage = ref('')

const handleUpdateAvailable = (event: CustomEvent) => {
  updateMessage.value = event.detail.message
  showUpdateToast.value = true
}

const refreshPage = () => {
  window.location.reload()
}

const closeToast = () => {
  showUpdateToast.value = false
}

onMounted(() => {
  window.addEventListener('pwa-update-available', handleUpdateAvailable as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('pwa-update-available', handleUpdateAvailable as EventListener)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="showUpdateToast"
        class="fixed bottom-4 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-card/90 px-4 py-3 shadow-2xl backdrop-blur-md sm:w-auto"
      >
        <div class="flex items-center gap-3">
          <RefreshCw
            weight="duotone"
            class="h-5 w-5 flex-shrink-0 animate-spin-slow text-primary"
          />
          <span class="text-sm font-medium">{{ updateMessage }}</span>
        </div>
        <div class="flex flex-shrink-0 items-center gap-2">
          <AppButton size="sm" @click="refreshPage">立即刷新</AppButton>
          <button
            class="rounded p-1 transition-colors hover:bg-muted"
            aria-label="关闭"
            @click="closeToast"
          >
            <X weight="duotone" class="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translate(-50%, 100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 100%);
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
