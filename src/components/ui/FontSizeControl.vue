<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    fontSize: number
    isEditing: boolean
    input: string
    min?: number
    max?: number
    /** 紧凑模式：移动端尺寸 */
    compact?: boolean
  }>(),
  { min: 10, max: 24, compact: false }
)

const emit = defineEmits<{
  decrease: []
  increase: []
  'start-edit': []
  commit: []
  cancel: []
  'update:input': [value: string]
}>()

const inputEl = ref<HTMLInputElement | null>(null)

// 编辑态由父组件持有；进入编辑时聚焦并全选（隐藏实例 focus 静默失败，无副作用）
watch(
  () => props.isEditing,
  editing => {
    if (editing) {
      nextTick(() => {
        inputEl.value?.focus()
        inputEl.value?.select()
      })
    }
  }
)

const btnBase = computed(() =>
  props.compact
    ? 'inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary/80 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary disabled:opacity-40'
    : 'inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/80 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary disabled:opacity-40'
)

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') emit('commit')
  else if (e.key === 'Escape') emit('cancel')
}
</script>

<template>
  <div class="flex items-center gap-0.5">
    <button
      :class="btnBase"
      :disabled="fontSize <= min"
      aria-label="减小字号"
      @click="emit('decrease')"
    >
      −
    </button>
    <input
      v-if="isEditing"
      ref="inputEl"
      :value="input"
      type="number"
      :min="min"
      :max="max"
      class="rounded border border-primary bg-background px-1 py-0.5 text-center font-mono text-sm focus:outline-none"
      :class="compact ? 'h-8 w-12' : 'w-14'"
      @input="emit('update:input', ($event.target as HTMLInputElement).value)"
      @blur="emit('commit')"
      @keydown="onKeydown"
    />
    <button
      v-else
      class="cursor-pointer rounded text-center font-mono text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      :class="compact ? 'h-8 w-8' : 'h-9 w-10'"
      aria-label="编辑字号"
      @click="emit('start-edit')"
    >
      {{ fontSize }}
    </button>
    <button
      :class="btnBase"
      :disabled="fontSize >= max"
      aria-label="增大字号"
      @click="emit('increase')"
    >
      +
    </button>
  </div>
</template>
