import { reactive } from 'vue'

export interface ToastItem {
  id: number
  type: 'success' | 'error'
  message: string
}

const state = reactive<{ items: ToastItem[] }>({ items: [] })

let uid = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

const push = (type: ToastItem['type'], message: string, duration = 1500) => {
  const id = ++uid
  state.items.push({ id, type, message })
  timers.set(
    id,
    setTimeout(() => {
      dismiss(id)
    }, duration)
  )
  return id
}

const dismiss = (id: number) => {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  const index = state.items.findIndex(item => item.id === id)
  if (index !== -1) state.items.splice(index, 1)
}

export const toast = {
  items: state.items,
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  dismiss
}
