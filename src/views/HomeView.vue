<script setup lang="ts">
import { ref } from 'vue'
import { apiClient } from '@/lib/ApiClient'
import { useRouter } from 'vue-router'
import { t } from '@/lib/i18n'
import {
  parseArchive,
  isArchiveFile,
  isTextFile,
  TEXT_EXTENSIONS,
  type ExtractedFile
} from '@/lib/archiveParser'
import {
  Archive,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookText,
  Upload
} from 'lucide-vue-next'

const content = ref('')
const loading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const router = useRouter()
const isDragging = ref(false)
const notifications = ref<{ id: number; type: 'success' | 'error'; message: string }[]>([])
let notificationId = 0

const addNotification = (type: 'success' | 'error', message: string) => {
  const id = ++notificationId
  notifications.value.push({ id, type, message })
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 3000)
}

const removeNotification = (id: number) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

const extractedFiles = ref<ExtractedFile[]>([])
const uploadProgress = ref<{ current: number; total: number; uploading: string } | null>(null)

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  if (!file) return

  await handleFile(file)
}

const handleFile = async (file: File) => {
  // 与后端限制对齐：10 MiB（/v1/limits maxLength）
  if (file.size > 10 * 1024 * 1024) {
    error.value = t('file_too_large_10mib')
    return
  }

  error.value = ''
  extractedFiles.value = []

  if (isArchiveFile(file.name)) {
    try {
      loading.value = true
      const files = await parseArchive(file)

      if (files.length === 0) {
        error.value = t('no_files_in_archive')
        loading.value = false
        return
      }

      extractedFiles.value = files
      loading.value = false
      addNotification(
        'success',
        t('files_parsed_success').replace('{count}', files.length.toString())
      )
    } catch (e: any) {
      console.error('Failed to parse archive:', e)
      error.value = e.message || t('parse_archive_failed')
      loading.value = false
    }
  } else if (isTextFile(file.name)) {
    try {
      const text = await file.text()
      content.value = text
      extractedFiles.value = [
        {
          name: file.name,
          content: text,
          size: text.length,
          path: file.name
        }
      ]
      addNotification('success', t('file_loaded_success'))
    } catch {
      error.value = t('file_read_error')
    }
  } else {
    error.value = t('unsupported_file_format')
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length === 0)
    return

  const file = event.dataTransfer.files[0]
  if (!file) return

  await handleFile(file)
}

const removeFile = (path: string) => {
  extractedFiles.value = extractedFiles.value.filter(f => f.path !== path)
}

const saveLogToken = (id: string | null, token: string | null | undefined) => {
  if (id && token) {
    localStorage.setItem(`log_token_${id}`, token)
  }
}

const uploadAllFiles = async () => {
  if (extractedFiles.value.length === 0) return

  // 服务端限制：文件数 ≤200，解压后累计 ≤12MB
  if (extractedFiles.value.length > 200) {
    error.value = t('too_many_files')
    return
  }
  const totalSize = extractedFiles.value.reduce((sum, f) => sum + f.size, 0)
  if (totalSize > 12 * 1024 * 1024) {
    error.value = t('files_too_large_12mb')
    return
  }

  loading.value = true
  error.value = ''
  uploadProgress.value = { current: 1, total: 1, uploading: extractedFiles.value[0]!.name }

  try {
    const main = extractedFiles.value[0]!
    // 不传 content：服务端取 files[0] 作为主文件，meta.files 与下拉列表保持一致
    const result = await apiClient.submitLog({
      files: extractedFiles.value.map(f => ({ name: f.path || f.name, content: f.content })),
      metadata: [
        {
          key: 'filename',
          value: main.name,
          label: '文件名',
          visible: false
        },
        {
          key: 'size',
          value: totalSize,
          label: '文件大小',
          visible: false
        }
      ],
      source: 'web-upload'
    })

    if (result.success && result.id) {
      saveLogToken(result.id, result.token)
      router.push(`/${result.id}`)
    } else {
      throw new Error(result.message || t('unknown_error'))
    }
  } catch (e: any) {
    console.error('Upload error:', e)
    error.value =
      e.response?.data?.error || e.response?.data?.message || e.message || t('save_failed')
  } finally {
    uploadProgress.value = null
    loading.value = false
  }
}

const save = async () => {
  if (!content.value.trim()) return

  loading.value = true
  error.value = ''

  try {
    const result = await apiClient.submitLog({
      content: content.value,
      metadata: [
        { key: 'filename', value: 'log.txt', label: '文件名', visible: false },
        { key: 'size', value: content.value.length, label: '文件大小', visible: false }
      ],
      source: 'web-upload'
    })

    if (result.success && result.id) {
      saveLogToken(result.id, result.token)
      router.push(`/${result.id}`)
    } else {
      throw new Error(result.message || t('unknown_error'))
    }
  } catch (e: any) {
    console.error(e)
    error.value =
      e.response?.data?.error || e.response?.data?.message || e.message || t('save_failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 bg-transparent">
    <div class="flex flex-col flex-1 min-h-0">
      <div
        class="flex flex-col flex-1 min-h-0 bg-card/80 backdrop-blur-xl text-card-foreground shadow-sm overflow-hidden"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          :accept="[...TEXT_EXTENSIONS, '.zip'].join(',')"
          @change="onFileSelected"
        />

        <div
          v-show="isDragging"
          class="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 pointer-events-none"
        >
          <div class="text-center">
            <Upload class="h-12 w-12 mx-auto text-primary mb-2" />
            <p class="text-lg font-medium text-primary">{{ t('release_to_upload') }}</p>
          </div>
        </div>

        <div v-if="extractedFiles.length > 0" class="flex-1 min-h-0 flex flex-col p-4">
          <div v-if="uploadProgress" class="mb-4 p-3 rounded-lg border bg-muted/50">
            <div class="flex items-center gap-2 mb-2">
              <Loader2 class="h-4 w-4 animate-spin text-primary" />
              <span class="text-sm text-muted-foreground">
                {{
                  t('uploading_progress')
                    .replace('{current}', uploadProgress.current.toString())
                    .replace('{total}', uploadProgress.total.toString())
                    .replace('{filename}', uploadProgress.uploading)
                }}
              </span>
            </div>
            <div class="w-full bg-muted rounded-full h-2">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }"
              ></div>
            </div>
          </div>

          <div class="space-y-2 flex-1 min-h-0 overflow-y-auto">
            <div
              v-for="file in extractedFiles"
              :key="file.path"
              class="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <FileText class="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ file.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ file.path }}</div>
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ (file.size / 1024).toFixed(1) }} KB
                </div>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <button
                  v-if="!uploadProgress"
                  class="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  @click="removeFile(file.path)"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            class="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground"
          >
            <span>{{ t('files_count').replace('{count}', extractedFiles.length.toString()) }}</span>
            <button
              :disabled="loading || uploadProgress !== null"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              @click="uploadAllFiles"
            >
              <CheckCircle class="h-3.5 w-3.5" />
              {{ loading ? t('saving') : t('batch_upload') }}
            </button>
          </div>
        </div>

        <div v-else class="relative flex flex-col flex-1 min-h-0">
          <textarea
            v-model="content"
            class="flex-1 w-full p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
            :placeholder="t('paste_here')"
          ></textarea>

          <div
            class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <div v-if="!content" class="text-center">
              <div class="flex items-center justify-center gap-4 mb-4">
                <Archive class="h-16 w-16 opacity-50 text-muted-foreground" />
                <FileText class="h-16 w-16 opacity-50 text-muted-foreground" />
                <BookText class="h-16 w-16 opacity-50 text-muted-foreground" />
              </div>
              <p class="text-base text-muted-foreground">{{ t('drag_drop_hint') }}</p>
              <p class="text-sm mt-1 text-muted-foreground">
                {{ t('supported_formats_hint') }}
              </p>
              <div class="mt-6 pointer-events-auto flex items-center justify-center gap-4">
                <button
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  @click="triggerFileSelect"
                >
                  <Archive class="h-4 w-4" />
                  {{ t('select_file') }}
                </button>
                <button
                  disabled
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-muted text-muted-foreground font-medium text-sm opacity-50"
                >
                  <Upload class="h-4 w-4" />
                  {{ t('save_log') }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="content"
            class="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none"
          >
            <div class="pointer-events-auto flex items-center gap-3">
              <button
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur border shadow-sm text-foreground font-medium text-sm hover:bg-accent transition-colors"
                @click="triggerFileSelect"
              >
                <Archive class="h-4 w-4" />
                {{ t('select_file') }}
              </button>
              <button
                :disabled="loading"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                :class="{ 'animate-pulse-save': !loading }"
                @click="save"
              >
                <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
                <Upload v-else class="h-4 w-4" />
                {{ loading ? t('saving') : t('save_log') }}
              </button>
            </div>
          </div>

          <div
            v-if="error"
            class="absolute bottom-16 left-4 right-4 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm"
          >
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="fixed top-24 right-4 z-50 space-y-2">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg bg-card min-w-[300px]"
        :class="notification.type === 'success' ? 'border-green-500/50' : 'border-destructive/50'"
      >
        <CheckCircle
          v-if="notification.type === 'success'"
          class="h-5 w-5 text-green-500 flex-shrink-0"
        />
        <AlertCircle v-else class="h-5 w-5 text-destructive flex-shrink-0" />
        <span class="text-sm flex-1">{{ notification.message }}</span>
        <button class="text-gray-400 hover:text-white" @click="removeNotification(notification.id)">
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes pulse-save {
  0%,
  100% {
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4);
  }
  50% {
    box-shadow: 0 0 0 12px hsl(var(--primary) / 0);
  }
}

.animate-pulse-save {
  animation: pulse-save 2s ease-in-out infinite;
}
</style>
