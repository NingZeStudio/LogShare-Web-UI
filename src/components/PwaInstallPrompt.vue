<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { X, Download } from 'lucide-vue-next'

const showInstallPrompt = ref(false)
let deferredPrompt: any = null

const installApp = () => {
  if (!deferredPrompt) return

  deferredPrompt.prompt()
  deferredPrompt.userChoice.then((choiceResult: any) => {
    if (choiceResult.outcome === 'accepted') {
      showInstallPrompt.value = false
      localStorage.setItem('pwa_install_dismissed', 'true')
    }
    deferredPrompt = null
  })
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa_install_dismissed', 'true')
}

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault()
  deferredPrompt = event

  if (!localStorage.getItem('pwa_install_dismissed')) {
    showInstallPrompt.value = true
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="showInstallPrompt"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] sm:w-auto max-w-sm flex items-center gap-3 bg-card border border-border rounded-lg shadow-2xl px-4 py-3 animate-in fade-in slide-in-from-bottom-4"
      >
        <Download class="h-5 w-5 text-primary flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">安装本站 PWA 应用</p>
          <p class="text-xs text-muted-foreground">获得更便捷的访问体验</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            class="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors font-medium whitespace-nowrap"
            @click="installApp"
          >
            立即安装
          </button>
          <button
            class="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
            aria-label="关闭"
            @click="dismissPrompt"
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
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
