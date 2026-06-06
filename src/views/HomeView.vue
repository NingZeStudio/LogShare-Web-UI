<script setup lang="ts">
import { ref } from 'vue'
import { apiClient } from '@/lib/ApiClient'
import { useRouter } from 'vue-router'
import { t } from '@/lib/i18n'
import { parseArchive, isArchiveFile, isTextFile, type ExtractedFile } from '@/lib/archiveParser'
import {
  Archive,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Link,
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
const uploadResults = ref<
  {
    name: string
    path: string
    success: boolean
    id?: string | null
    token?: string | null
    error?: string
  }[]
>([])
const isCopySuccess = ref(false)

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
  if (file.size > 50 * 1024 * 1024) {
    error.value = t('file_too_large_50mb')
    return
  }

  error.value = ''
  extractedFiles.value = []
  uploadResults.value = []

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
  uploadResults.value = uploadResults.value.filter(r => r.path !== path)
}

const uploadFile = async (
  file: ExtractedFile
): Promise<{ id: string | null; token: string | null }> => {
  try {
    const result = await apiClient.submitLog({
      content: file.content,
      metadata: [
        {
          key: 'filename',
          value: file.name,
          label: '文件名',
          visible: false
        },
        {
          key: 'size',
          value: file.size,
          label: '文件大小',
          visible: false
        }
      ],
      source: 'web-upload'
    })

    if (result.success) {
      return { id: result.id, token: result.token }
    } else {
      throw new Error(result.message || t('unknown_error'))
    }
  } catch (e: any) {
    console.error('Upload error:', e)
    throw new Error(e.message || t('save_failed'))
  }
}

const uploadAllFiles = async () => {
  if (extractedFiles.value.length === 0) return

  loading.value = true
  error.value = ''
  uploadResults.value = []

  try {
    for (let i = 0; i < extractedFiles.value.length; i++) {
      const file = extractedFiles.value[i]
      if (!file) continue

      uploadProgress.value = {
        current: i + 1,
        total: extractedFiles.value.length,
        uploading: file.name
      }

      try {
        const result = await uploadFile(file)
        uploadResults.value.push({
          name: file.name,
          path: file.path,
          success: true,
          id: result.id,
          token: result.token
        })
        addNotification('success', `${file.name} 上传成功`)
      } catch (e: any) {
        uploadResults.value.push({
          name: file.name,
          path: file.path,
          success: false,
          error: e.message || t('save_failed')
        })
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    uploadProgress.value = null
  } catch (e: any) {
    console.error('Batch upload error:', e)
    error.value = e.message || t('save_failed')
    uploadProgress.value = null
  } finally {
    loading.value = false
  }
}

const uploadSingleFile = async (file: ExtractedFile | undefined) => {
  if (!file) return

  loading.value = true
  error.value = ''

  try {
    const result = await uploadFile(file)
    if (result.id) {
      // 将 token 保存到 localStorage，方便后续删除
      localStorage.setItem(`log_token_${result.id}`, result.token || '')
      router.push(`/${result.id}`)
    }
  } catch (e: any) {
    console.error(e)
    error.value = e.message || t('save_failed')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!content.value.trim()) return

  await uploadSingleFile({
    name: 'log.txt',
    content: content.value,
    size: content.value.length,
    path: 'log.txt'
  })
}

const copyAllLinks = async () => {
  const successResults = uploadResults.value.filter(r => r.success && r.id)
  if (successResults.length === 0) {
    error.value = t('no_uploaded_files')
    return
  }

  const baseUrl = window.location.origin + window.location.pathname
  const links = successResults.map(r => `${baseUrl}${r.id}`).join('\n')
  const message = t('copy_links') + ':\n' + links

  try {
    await navigator.clipboard.writeText(message)
    isCopySuccess.value = true
    setTimeout(() => {
      isCopySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    const textArea = document.createElement('textarea')
    textArea.value = message
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    isCopySuccess.value = true
    setTimeout(() => {
      isCopySuccess.value = false
    }, 2000)
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
            accept=".txt,.log,.yml,.yaml,.json,.xml,.cfg,.conf,.properties,.toml,.zip,.bin"
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
                    <template v-if="uploadResults.length > 0">
                      <template v-if="uploadResults.find(r => r.path === file.path)?.success">
                        <CheckCircle class="h-5 w-5 text-green-500" />
                        <a
                          :href="uploadResults.find(r => r.path === file.path)?.id || ''"
                          class="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md hover:bg-primary/90 transition-colors"
                          target="_blank"
                        >
                          <Link class="h-3 w-3" />
                          <span>{{ t('view') }}</span>
                        </a>
                      </template>
                      <template v-else-if="uploadResults.find(r => r.path === file.path)">
                        <AlertCircle class="h-5 w-5 text-destructive" />
                        <span
                          class="text-xs text-destructive"
                          :title="uploadResults.find(r => r.path === file.path)?.error"
                          >{{ t('failed') }}</span
                        >
                      </template>
                    </template>
                    <button
                      v-if="!uploadProgress && uploadResults.length === 0"
                      :disabled="loading"
                      class="inline-flex items-center text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                      @click="uploadSingleFile(file)"
                    >
                      {{ loading ? t('saving') : t('upload') }}
                    </button>
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
                <span>{{
                  t('files_count').replace('{count}', extractedFiles.length.toString())
                }}</span>
                <div class="flex items-center gap-2">
                  <span v-if="uploadResults.length > 0">
                    {{
                      t('upload_success_count')
                        .replace('{success}', uploadResults.filter(r => r.success).length.toString())
                        .replace('{failed}', uploadResults.filter(r => !r.success).length.toString())
                    }}
                  </span>
                  <button
                    v-if="uploadResults.length === 0"
                    :disabled="loading || uploadProgress !== null"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    @click="uploadAllFiles"
                  >
                    <CheckCircle class="h-3.5 w-3.5" />
                    {{ loading ? t('saving') : t('batch_upload') }}
                  </button>
                  <button
                    v-if="uploadResults.length > 0"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                    @click="copyAllLinks"
                  >
                    <Copy class="h-3.5 w-3.5" />
                    {{ isCopySuccess ? t('copied') : t('copy_links') }}
                  </button>
                </div>
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
          <button
            class="text-gray-400 hover:text-white"
            @click="removeNotification(notification.id)"
          >
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
  0%, 100% {
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
