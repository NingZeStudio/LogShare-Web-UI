<script setup lang="ts">
import { ref } from 'vue'
import { apiClient } from '@/lib/api'
import { useRouter } from 'vue-router'
import { t } from '@/lib/i18n'
import { parseArchive, isArchiveFile, isTextFile, type ExtractedFile } from '@/lib/archiveParser'
import { Archive, FileText, X, CheckCircle, AlertCircle, Loader2, Copy, Link } from 'lucide-vue-next'

const content = ref('')
const loading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const router = useRouter()
const isDragging = ref(false)

// 通知
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

// 压缩包相关文件
const extractedFiles = ref<ExtractedFile[]>([])
const uploadProgress = ref<{ current: number; total: number; uploading: string } | null>(null)
const uploadResults = ref<{ name: string; path: string; success: boolean; id?: string | null; error?: string }[]>([])
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

// 处理文件（支持压缩包和普通文本文件）
const handleFile = async (file: File) => {
  if (file.size > 50 * 1024 * 1024) {
    error.value = '文件过大 (最大 50MB)'
    return
  }

  error.value = ''
  extractedFiles.value = []
  uploadResults.value = []

  // 检查是否为压缩包
  if (isArchiveFile(file.name)) {
    try {
      loading.value = true
      const files = await parseArchive(file)
      
      if (files.length === 0) {
        error.value = '压缩包中没有可识别的文本文件 (.txt, .log, .yml 等)'
        loading.value = false
        return
      }
      
      extractedFiles.value = files
      loading.value = false
      addNotification('success', `成功解析 ${files.length} 个文件`)
    } catch (e: any) {
      console.error('Failed to parse archive:', e)
      error.value = e.message || '解析压缩包失败'
      loading.value = false
    }
  } else if (isTextFile(file.name)) {
    // 普通文本文件
    try {
      const text = await file.text()
      content.value = text
      extractedFiles.value = [{
        name: file.name,
        content: text,
        size: text.length,
        path: file.name
      }]
      addNotification('success', '文件加载成功')
    } catch (e) {
      error.value = t('file_read_error')
    }
  } else {
    error.value = '不支持的文件格式，请上传 .zip 压缩包或 .txt/.log 等文本文件'
  }
}

// Drag and drop functionality
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

  if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length === 0) return

  const file = event.dataTransfer.files[0]
  if (!file) return

  await handleFile(file)
}

// 移除单个文件
const removeFile = (path: string) => {
  extractedFiles.value = extractedFiles.value.filter(f => f.path !== path)
  uploadResults.value = uploadResults.value.filter(r => r.path !== path)
}

// 上传单个文件
const uploadFile = async (file: ExtractedFile): Promise<string | null> => {
  const params = new URLSearchParams()
  params.append('content', file.content)

  const response = await apiClient.post('/1/log', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  if (response.data.success) {
    return response.data.id
  } else {
    throw new Error(response.data.error || t('unknown_error'))
  }
}

// 批量上传压缩包中的所有文件
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
        const id = await uploadFile(file)
        uploadResults.value.push({
          name: file.name,
          path: file.path,
          success: true,
          id: id || undefined
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

      // 添加小延迟避免请求过快
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

// 上传单个选中的文件
const uploadSingleFile = async (file: ExtractedFile | undefined) => {
  if (!file) return
  
  loading.value = true
  error.value = ''

  try {
    const id = await uploadFile(file)
    router.push(`/${id}`)
  } catch (e: any) {
    console.error(e)
    error.value = e.message || t('save_failed')
  } finally {
    loading.value = false
  }
}

// 保存单个文件（非压缩包模式）
const save = async () => {
  if (!content.value.trim()) return

  await uploadSingleFile({
    name: 'log.txt',
    content: content.value,
    size: content.value.length,
    path: 'log.txt'
  })
}

// 重置到初始状态
const reset = () => {
  content.value = ''
  extractedFiles.value = []
  uploadResults.value = []
  uploadProgress.value = null
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 复制所有成功上传的日志链接
const copyAllLinks = async () => {
  const successResults = uploadResults.value.filter(r => r.success && r.id)
  if (successResults.length === 0) {
    error.value = '没有成功上传的日志文件'
    return
  }

  const baseUrl = window.location.origin + window.location.pathname
  const links = successResults.map(r => `${baseUrl}${r.id}`).join('\n')
  const message = `批量上传的日志链接：\n${links}`

  try {
    await navigator.clipboard.writeText(message)
    isCopySuccess.value = true
    setTimeout(() => {
      isCopySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案
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
  <div class="min-h-screen flex flex-col relative overflow-hidden">
    <!-- 动态网格背景 -->
    <div class="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5">
      <!-- 网格层 -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    </div>

    <!-- 标题 Banner -->
    <div class="relative pt-16 pb-8 px-4">
      <div class="container mx-auto text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/20 text-primary text-sm font-medium mb-4 backdrop-blur-xl shadow-sm">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          专业级 Minecraft 日志分析工具
        </div>
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent drop-shadow-2xl">
          LogShare.CN
          <sup class="text-2xl md:text-3xl font-bold text-primary/60">NEXT</sup>
        </h1>
        <p class="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
          {{ t('home_subtitle') }}
        </p>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 container mx-auto px-4 pb-12 flex flex-col items-center gap-8 relative">
      <!-- Main Paste Area with Mac-style window -->
      <div
        class="w-full max-w-4xl overflow-hidden flex flex-col relative group"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
      <!-- Mac-style window header -->
      <div class="bg-gray-800 dark:bg-gray-700 rounded-t-xl px-4 py-2 flex items-center justify-between border-b border-gray-700 dark:border-gray-600">
        <div class="flex items-center gap-2">
          <div class="flex gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span class="text-gray-300 dark:text-gray-200 text-sm ml-2">
            {{ extractedFiles.length > 0 ? `${extractedFiles.length} 个文件` : t('log') }}
          </span>
        </div>
        <div class="flex gap-2">
          <input type="file" ref="fileInput" class="hidden" @change="onFileSelected" accept=".txt,.log,.yml,.yaml,.json,.xml,.cfg,.conf,.properties,.toml,.zip,.bin">
          <button
            @click="triggerFileSelect"
            class="text-gray-300 dark:text-gray-200 hover:text-white text-sm flex items-center gap-1"
          >
            <Archive class="h-4 w-4" />
            {{ t('select_file') }}
          </button>
          <button
            v-if="extractedFiles.length > 0"
            @click="reset"
            class="text-gray-300 dark:text-gray-200 hover:text-white text-sm flex items-center gap-1"
          >
            <X class="h-4 w-4" />
            重置
          </button>
          <button
            v-if="!extractedFiles.length"
            @click="save"
            :disabled="loading || !content"
            class="text-gray-300 dark:text-gray-200 hover:text-white text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            {{ loading ? t('saving') : t('save_log') }}
          </button>
          <button
            v-if="extractedFiles.length > 0 && uploadResults.length === 0"
            @click="uploadAllFiles"
            :disabled="loading || uploadProgress !== null"
            class="text-gray-300 dark:text-gray-200 hover:text-white text-sm flex items-center gap-1 bg-primary/20 px-2 py-1 rounded"
          >
            <CheckCircle class="h-4 w-4" />
            {{ loading ? t('saving') : '批量上传' }}
          </button>
          <button
            v-if="extractedFiles.length > 0 && uploadResults.length > 0"
            @click="copyAllLinks"
            class="text-gray-300 dark:text-gray-200 hover:text-white text-sm flex items-center gap-1 bg-green-600/20 px-2 py-1 rounded hover:bg-green-600/30 transition-colors"
          >
            <Copy class="h-4 w-4" />
            <span :class="isCopySuccess ? 'text-green-400' : ''">{{ isCopySuccess ? '已复制' : '复制链接' }}</span>
          </button>
        </div>
      </div>

      <!-- Drop zone indicator -->
      <div v-show="isDragging" class="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center z-10 pointer-events-none">
        <div class="bg-blue-500 text-white px-4 py-2 rounded-xl text-lg font-semibold">
          {{ t('home_subtitle') }}
        </div>
      </div>

      <!-- Main content area -->
      <div class="bg-[#1a1a1a] dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-b-xl shadow-lg overflow-hidden flex flex-col">
        <!-- 压缩包文件列表 -->
        <div v-if="extractedFiles.length > 0" class="p-4">
          <!-- 进度条 -->
          <div v-if="uploadProgress" class="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl">
            <div class="flex items-center gap-2 mb-2">
              <Loader2 class="h-4 w-4 animate-spin text-primary" />
              <span class="text-sm text-primary">
                正在上传 ({{ uploadProgress.current }}/{{ uploadProgress.total }}): {{ uploadProgress.uploading }}
              </span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div 
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- 文件列表 -->
          <div class="space-y-2 max-h-[500px] overflow-y-auto">
            <div
              v-for="file in extractedFiles"
              :key="file.path"
              class="flex items-center justify-between p-3 bg-gray-800/50 dark:bg-gray-800/30 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <FileText class="h-5 w-5 text-white flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-100 truncate">{{ file.name }}</div>
                  <div class="text-xs text-gray-400">{{ file.path }}</div>
                </div>
                <div class="text-xs text-gray-500">{{ (file.size / 1024).toFixed(1) }} KB</div>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <!-- 上传结果状态 -->
                <template v-if="uploadResults.length > 0">
                  <template v-if="uploadResults.find(r => r.path === file.path)?.success">
                    <CheckCircle class="h-5 w-5 text-green-500" />
                    <a
                      :href="uploadResults.find(r => r.path === file.path)?.id || ''"
                      class="text-xs bg-white text-gray-900 px-2 py-1 rounded hover:bg-gray-200 transition-colors font-medium"
                      target="_blank"
                    >
                      <div class="flex items-center gap-1">
                        <Link class="h-3 w-3" />
                        <span>查看</span>
                      </div>
                    </a>
                  </template>
                  <template v-else-if="uploadResults.find(r => r.path === file.path)">
                    <AlertCircle class="h-5 w-5 text-red-500" />
                    <span class="text-xs text-red-400" :title="uploadResults.find(r => r.path === file.path)?.error">失败</span>
                  </template>
                </template>
                <!-- 上传按钮 -->
                <button
                  v-if="!uploadProgress && uploadResults.length === 0"
                  @click="uploadSingleFile(file)"
                  :disabled="loading"
                  class="text-xs bg-white text-gray-900 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                >
                  {{ loading ? t('saving') : '上传' }}
                </button>
                <!-- 移除按钮 -->
                <button
                  v-if="!uploadProgress"
                  @click="removeFile(file.path)"
                  class="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
            <span>共 {{ extractedFiles.length }} 个文件</span>
            <span v-if="uploadResults.length > 0">
              成功：{{ uploadResults.filter(r => r.success).length }} |
              失败：{{ uploadResults.filter(r => !r.success).length }}
            </span>
          </div>
        </div>

        <!-- 普通文本编辑区域 -->
        <div v-else class="relative flex-1">
          <textarea
            v-model="content"
            class="w-full h-[500px] p-4 bg-[#1a1a1a] dark:bg-gray-900 text-gray-100 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none"
            :placeholder="t('paste_here')"
          ></textarea>

          <!-- 居中提示文字 -->
          <div 
            v-if="!content" 
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div class="text-center text-gray-500 dark:text-gray-400">
              <p class="text-lg font-medium">将文件拖动至此上传日志文件</p>
              <p class="text-sm mt-1">支持 .zip 压缩包和日志文本文件</p>
            </div>
          </div>

          <div v-if="error" class="absolute bottom-4 left-4 right-4 bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-xl text-sm">
            {{ error }}
          </div>
        </div>
      </div>
     </div>
    </div>

    <!-- 通知弹出 -->
    <div class="fixed top-24 right-4 z-50 space-y-2">
      <TransitionGroup name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] max-w-md',
            notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          ]"
        >
          <CheckCircle v-if="notification.type === 'success'" class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <AlertCircle v-else class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span class="text-sm flex-1" :class="notification.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
            {{ notification.message }}
          </span>
          <button @click="removeNotification(notification.id)" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* 通知动画 */
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

/* 功能说明 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 768px) {
  .feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.minecraft-text, .logs-text {
  display: inline-block;
  position: relative;
  animation: hueRotate 4s infinite linear;
}

@keyframes hueRotate {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}
</style>
