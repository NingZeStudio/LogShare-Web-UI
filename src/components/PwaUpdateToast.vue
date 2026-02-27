<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { X, RefreshCw } from 'lucide-vue-next'

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
        class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border rounded-lg shadow-2xl px-4 py-3 animate-in fade-in slide-in-from-bottom-4"
      >
        <div class="flex items-center gap-3">
          <RefreshCw class="h-5 w-5 text-primary animate-spin-slow" />
          <span class="text-sm font-medium">{{ updateMessage }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="refreshPage"
            class="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors font-medium"
          >
            立即刷新
          </button>
          <button
            @click="closeToast"
            class="p-1 hover:bg-muted rounded transition-colors"
            aria-label="关闭"
          >
            <X class="h-4 w-4 text-muted-foreground" />
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
