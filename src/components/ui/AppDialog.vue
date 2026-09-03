<script setup lang="ts">
import { PhX as X } from '@phosphor-icons/vue'
import { t } from '@/lib/i18n'

withDefaults(
  defineProps<{
    open: boolean
    /** 弹窗宽度档位 */
    width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    /** 点击遮罩是否关闭 */
    closeOnBackdrop?: boolean
    /** 顶部右侧是否显示关闭按钮 */
    showClose?: boolean
    /** 无障碍标签 */
    ariaLabel?: string
  }>(),
  {
    width: 'sm',
    closeOnBackdrop: true,
    showClose: true
  }
)

const emit = defineEmits<{ close: [] }>()

const widthClass: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-4xl',
  '2xl': 'max-w-[560px]'
}
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
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        @click.self="closeOnBackdrop && emit('close')"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div
            class="relative max-h-[85vh] w-full overflow-y-auto rounded-lg bg-card text-card-foreground shadow-2xl"
            :class="widthClass"
          >
            <button
              v-if="showClose"
              class="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              :aria-label="t('close')"
              @click="emit('close')"
            >
              <X weight="duotone" class="h-4 w-4" />
            </button>
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

