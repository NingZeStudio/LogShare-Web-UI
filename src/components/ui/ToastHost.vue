<script setup lang="ts">
import {
  PhCheckCircle as CheckCircle,
  PhWarningCircle as AlertCircle,
  PhX as X
} from '@phosphor-icons/vue'
import { t } from '@/lib/i18n'
import { toast } from '@/lib/toast'
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed top-24 right-4 z-50 space-y-2">
      <TransitionGroup name="toast">
        <div
          v-for="item in toast.items"
          :key="item.id"
          class="pointer-events-auto flex min-w-[300px] items-center gap-3 rounded-lg border bg-card/70 px-4 py-3 shadow-lg backdrop-blur-md"
          :class="item.type === 'success' ? 'border-green-500/50' : 'border-destructive/50'"
          :role="item.type === 'error' ? 'alert' : 'status'"
        >
          <CheckCircle
            v-if="item.type === 'success'"
            weight="duotone"
            class="h-5 w-5 flex-shrink-0 text-green-500"
          />
          <AlertCircle v-else weight="duotone" class="h-5 w-5 flex-shrink-0 text-destructive" />
          <span class="flex-1 text-sm">{{ item.message }}</span>
          <button
            class="text-muted-foreground transition-colors hover:text-foreground"
            :aria-label="t('close')"
            @click="toast.dismiss(item.id)"
          >
            <X weight="duotone" class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
