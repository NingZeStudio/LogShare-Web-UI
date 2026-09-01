<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { PhX as X, PhDownload as Download } from '@phosphor-icons/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { DEPLOY_HASH } from '@/lib/deployInfo'

const DISMISS_KEY = 'pwa_install_dismissed_ver'

const showInstallPrompt = ref(false)
let deferredPrompt: any = null

const installApp = () => {
  if (!deferredPrompt) return

  deferredPrompt.prompt()
  deferredPrompt.userChoice.then((choiceResult: any) => {
    if (choiceResult.outcome === 'accepted') {
      showInstallPrompt.value = false
      localStorage.setItem(DISMISS_KEY, DEPLOY_HASH)
    }
    deferredPrompt = null
  })
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem(DISMISS_KEY, DEPLOY_HASH)
}

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault()
  deferredPrompt = event

  // 每个新版本允许重新提示一次
  if (localStorage.getItem(DISMISS_KEY) !== DEPLOY_HASH) {
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
        class="fixed bottom-20 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-card/90 px-4 py-3 shadow-2xl backdrop-blur-md sm:w-auto"
      >
        <Download weight="duotone" class="h-5 w-5 flex-shrink-0 text-primary" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">安装本站 PWA 应用</p>
          <p class="text-xs text-muted-foreground">获得更便捷的访问体验</p>
        </div>
        <div class="flex flex-shrink-0 items-center gap-2">
          <AppButton size="sm" @click="installApp">立即安装</AppButton>
          <button
            class="rounded p-1 transition-colors hover:bg-muted"
            aria-label="关闭"
            @click="dismissPrompt"
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
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
