<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

type Variant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'soft-destructive'
  | 'outline'
  | 'ghost'
  | 'soft'
  | 'muted'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    disabled?: boolean
    as?: 'button' | 'a' | 'router-link'
    href?: string
    to?: string
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    as: 'button',
    type: 'button'
  }
)

const resolvedTag = computed(() => {
  if (props.as === 'router-link') return RouterLink
  return props.as
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-secondary/80 text-secondary-foreground hover:bg-secondary'
    case 'destructive':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    case 'soft-destructive':
      return 'bg-destructive/10 text-destructive hover:bg-destructive/20'
    case 'outline':
      return 'border border-border bg-transparent text-foreground hover:bg-accent'
    case 'ghost':
      return 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    case 'soft':
      return 'bg-primary/10 text-primary hover:bg-primary/20'
    case 'muted':
      return 'bg-muted text-foreground hover:bg-accent'
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary/90'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-7 px-2.5 text-xs gap-1 rounded-md'
    case 'lg':
      return 'h-11 px-6 text-base gap-2 rounded-lg'
    case 'icon':
      return 'h-8 w-8 rounded-md'
    default:
      return 'h-9 px-4 text-sm gap-1.5 rounded-md'
  }
})

const baseClass =
  'inline-flex items-center justify-center font-medium transition-colors select-none disabled:opacity-50 disabled:pointer-events-none'
</script>

<template>
  <component
    :is="resolvedTag"
    :href="as === 'a' ? href : undefined"
    :to="as === 'router-link' ? to : undefined"
    :target="as === 'a' ? '_blank' : undefined"
    :rel="as === 'a' ? 'noopener noreferrer' : undefined"
    :type="as === 'button' ? type : undefined"
    :disabled="as === 'button' ? disabled : undefined"
    :class="[baseClass, variantClass, sizeClass]"
  >
    <slot />
  </component>
</template>
