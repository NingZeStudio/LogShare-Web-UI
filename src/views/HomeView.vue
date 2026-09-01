<script setup lang="ts">
import { computed, ref } from 'vue'
import { apiClient } from '@/lib/ApiClient'
import { useRouter } from 'vue-router'
import { t } from '@/lib/i18n'
import { toast } from '@/lib/toast'
import AppButton from '@/components/ui/AppButton.vue'
import {
  parseArchive,
  isArchiveFile,
  isTextFile,
  TEXT_EXTENSIONS,
  type ExtractedFile
} from '@/lib/archiveParser'
import {
  PhArchive as Archive,
  PhFileText as FileText,
  PhX as X,
  PhCheckCircle as CheckCircle,
  PhCircleNotch as Loader2,
  PhBookOpenText as BookText,
  PhUpload as Upload,
  PhFileZip as FolderArchive,
  PhArrowCounterClockwise as Undo2,
  PhSquare as Square,
  PhCheckSquare as SquareCheckBig,
  PhTrash as Trash2
} from '@phosphor-icons/vue'

const content = ref('')
const loading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const router = useRouter()
const isDragging = ref(false)
/** 单文件直接填入输入框时记录原始文件名，上传时随 metadata 提交 */
const pendingFileName = ref('')

const extractedFiles = ref<ExtractedFile[]>([])
const uploadProgress = ref<{ current: number; total: number; uploading: string } | null>(null)

/** 多选删除：当前勾选的文件 key（path） */
const selectedPaths = ref<Set<string>>(new Set())
const selectedCount = computed(() => selectedPaths.value.size)
const isAllSelected = computed(
  () => extractedFiles.value.length > 0 && selectedPaths.value.size === extractedFiles.value.length
)

const toggleSelectAll = () => {
  selectedPaths.value = isAllSelected.value
    ? new Set()
    : new Set(extractedFiles.value.map(f => f.path))
}

/** 删除撤销：5 秒内可整批还原 */
const undoMessage = ref('')
const undoRestore = ref<(() => void) | null>(null)
let undoTimer: ReturnType<typeof setTimeout> | null = null

/** 大小自适应格式化：KB < 1024，否则 MB（一位小数） */
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 文件来源分组：zip 展开的文件按压缩包归属聚为一组，直接选择的散文件各自一组 */
interface FileGroup {
  /** 空字符串 = 无压缩包来源的散文件 */
  origin: string
  files: ExtractedFile[]
}

const fileGroups = computed<FileGroup[]>(() => {
  const groups: FileGroup[] = []
  const byOrigin = new Map<string, FileGroup>()
  for (const file of extractedFiles.value) {
    // archiveParser 以「压缩包名/内部路径」生成 path；首段即来源压缩包名
    const slash = file.path.indexOf('/')
    const origin = slash > 0 ? file.path.slice(0, slash) : ''
    let group = byOrigin.get(origin)
    if (!group) {
      group = { origin, files: [] }
      byOrigin.set(origin, group)
      groups.push(group)
    }
    group.files.push(file)
  }
  return groups
})

/** 展示用路径尾段：无来源组显示完整 path（保持目录层级语义），有来源组显示包内相对路径 */
const displayPath = (file: ExtractedFile, origin: string): string =>
  origin && file.path.startsWith(origin + '/') ? file.path.slice(origin.length + 1) : file.path

const toggleSelect = (path: string) => {
  const next = new Set(selectedPaths.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  selectedPaths.value = next
}

const clearSelection = () => {
  selectedPaths.value = new Set()
}

/** 删除（含撤销）：记录被删项与位置快照，5 秒内可整批还原 */
const deleteFiles = (paths: string[]) => {
  if (paths.length === 0) return
  const removed = extractedFiles.value.filter(f => paths.includes(f.path))
  if (removed.length === 0) return
  const snapshot = [...extractedFiles.value]
  extractedFiles.value = extractedFiles.value.filter(f => !paths.includes(f.path))
  selectedPaths.value = new Set([...selectedPaths.value].filter(p => !paths.includes(p)))
  undoMessage.value =
    removed.length === 1 ? `已移除 ${removed[0]!.name}` : `已移除 ${removed.length} 个文件`
  undoRestore.value = () => {
    extractedFiles.value = snapshot
    undoMessage.value = ''
  }
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = setTimeout(() => {
    undoMessage.value = ''
    undoRestore.value = null
  }, 5000)
}

const undoDelete = () => {
  undoRestore.value?.()
  undoRestore.value = null
}

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

      if (files.length === 1) {
        // 压缩包内仅一个文件：直接填入输入框
        content.value = files[0]!.content
        pendingFileName.value = files[0]!.name
        loading.value = false
        return
      }

      extractedFiles.value = files
      loading.value = false
      toast.success(t('files_parsed_success').replace('{count}', files.length.toString()))
    } catch (e: any) {
      console.error('Failed to parse archive:', e)
      error.value = e.message || t('parse_archive_failed')
      loading.value = false
    }
  } else if (isTextFile(file.name)) {
    try {
      const text = await file.text()
      // 单文件直接填入输入框，不进入文件列表视图
      content.value = text
      pendingFileName.value = file.name
      toast.success(t('file_loaded_success'))
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

const removeFile = (path: string) => deleteFiles([path])

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
        {
          key: 'filename',
          value: pendingFileName.value || 'log.txt',
          label: '文件名',
          visible: false
        },
        { key: 'size', value: content.value.length, label: '文件大小', visible: false }
      ],
      source: 'web-upload'
    })

    if (result.success && result.id) {
      saveLogToken(result.id, result.token)
      pendingFileName.value = ''
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
  <div class="flex min-h-[calc(100vh-3.5rem)] flex-col flex-1 bg-transparent">
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
            <Upload weight="duotone" class="h-12 w-12 mx-auto text-primary mb-2" />
            <p class="text-lg font-medium text-primary">{{ t('release_to_upload') }}</p>
          </div>
        </div>

        <div v-if="extractedFiles.length > 0" class="flex-1 min-h-0 flex flex-col p-4">
          <div v-if="uploadProgress" class="mb-4 p-3 rounded-lg border bg-muted/50">
            <div class="flex items-center gap-2 mb-2">
              <Loader2 weight="duotone" class="h-4 w-4 animate-spin text-primary" />
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

          <div class="space-y-4 flex-1 min-h-0 overflow-y-auto">
            <div v-for="group in fileGroups" :key="group.origin || '__loose__'">
              <!-- 组头：仅压缩包来源显示（散文件不占组头） -->
              <div
                v-if="group.origin"
                class="flex items-center gap-2 mb-1.5 px-0.5 text-xs text-muted-foreground"
              >
                <FolderArchive weight="duotone" class="h-3.5 w-3.5 flex-shrink-0" />
                <span class="font-medium text-foreground">{{ group.origin }}</span>
                <span>·</span>
                <span>{{
                  t('files_count').replace('{count}', group.files.length.toString())
                }}</span>
              </div>

              <div class="space-y-2">
                <div
                  v-for="file in group.files"
                  :key="file.path"
                  class="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  :class="{ 'ring-1 ring-primary bg-primary/5': selectedPaths.has(file.path) }"
                >
                  <!-- 勾选：整行点击切换（删除按钮除外） -->
                  <button
                    class="flex items-start gap-3 flex-1 min-w-0 text-left"
                    :aria-label="selectedPaths.has(file.path) ? '取消选择' : '选择'"
                    @click="toggleSelect(file.path)"
                  >
                    <component
                      :is="selectedPaths.has(file.path) ? SquareCheckBig : Square"
                      weight="duotone"
                      class="h-4 w-4 mt-0.5 flex-shrink-0"
                      :class="
                        selectedPaths.has(file.path) ? 'text-primary' : 'text-muted-foreground'
                      "
                    />
                    <FileText
                      weight="duotone"
                      class="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0 hidden sm:block"
                    />
                    <!-- 双行布局：名称一行，路径尾段 + 大小一行 -->
                    <span class="flex-1 min-w-0 block">
                      <span class="block text-sm font-medium truncate">{{ file.name }}</span>
                      <span
                        class="block text-xs text-muted-foreground truncate mt-0.5"
                        :title="file.path"
                      >
                        {{ displayPath(file, group.origin) }}
                        <span class="mx-1">·</span>{{ formatSize(file.size) }}
                      </span>
                    </span>
                  </button>
                  <button
                    class="p-1.5 ml-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    :aria-label="t('remove')"
                    @click.stop="removeFile(file.path)"
                  >
                    <X weight="duotone" class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            class="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground"
          >
            <span v-if="selectedCount > 0" class="text-foreground font-medium">
              {{
                t('selected_count')
                  .replace('{count}', selectedCount.toString())
                  .replace('{total}', extractedFiles.length.toString())
              }}
              <button
                class="ml-1 underline underline-offset-2 hover:text-foreground"
                @click="clearSelection"
              >
                {{ t('clear_selection') }}
              </button>
            </span>
            <span v-else>{{
              t('files_count').replace('{count}', extractedFiles.length.toString())
            }}</span>
            <div class="flex items-center gap-2">
              <AppButton
                v-if="extractedFiles.length > 0"
                variant="secondary"
                size="sm"
                @click="toggleSelectAll"
              >
                <SquareCheckBig v-if="isAllSelected" weight="duotone" class="h-3.5 w-3.5" />
                <Square v-else weight="duotone" class="h-3.5 w-3.5" />
                {{ isAllSelected ? t('clear_selection') : t('select_all') }}
              </AppButton>
              <AppButton
                v-if="selectedCount > 0"
                variant="destructive"
                size="sm"
                @click="deleteFiles([...selectedPaths])"
              >
                <Trash2 weight="duotone" class="h-3.5 w-3.5" />
                {{ t('delete_selected').replace('{count}', selectedCount.toString()) }}
              </AppButton>
              <AppButton
                :disabled="loading || uploadProgress !== null"
                size="sm"
                @click="uploadAllFiles"
              >
                <CheckCircle weight="duotone" class="h-3.5 w-3.5" />
                {{ loading ? t('saving') : t('batch_upload') }}
              </AppButton>
            </div>
          </div>

          <!-- 删除撤销 Toast -->
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 translate-y-1"
            leave-active-class="transition-all duration-150"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="undoMessage"
              class="mt-3 px-4 py-2.5 rounded-lg border bg-card shadow-sm flex items-center justify-between text-sm"
            >
              <span class="text-foreground">{{ undoMessage }}</span>
              <button
                class="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                @click="undoDelete"
              >
                <Undo2 weight="duotone" class="h-3.5 w-3.5" />
                {{ t('undo') }}
              </button>
            </div>
          </Transition>
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
                <Archive weight="duotone" class="h-16 w-16 opacity-50 text-muted-foreground" />
                <FileText weight="duotone" class="h-16 w-16 opacity-50 text-muted-foreground" />
                <BookText weight="duotone" class="h-16 w-16 opacity-50 text-muted-foreground" />
              </div>
              <p class="text-base text-muted-foreground">{{ t('drag_drop_hint') }}</p>
              <p class="text-sm mt-1 text-muted-foreground">
                {{ t('supported_formats_hint') }}
              </p>
              <div class="pointer-events-auto mt-6 flex items-center justify-center gap-4">
                <AppButton size="lg" @click="triggerFileSelect">
                  <Archive weight="duotone" class="h-4 w-4" />
                  {{ t('select_file') }}
                </AppButton>
                <AppButton variant="secondary" size="lg" disabled>
                  <Upload weight="duotone" class="h-4 w-4" />
                  {{ t('save_log') }}
                </AppButton>
              </div>
            </div>
          </div>

          <div
            v-if="content"
            class="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none"
          >
            <div class="pointer-events-auto flex items-center gap-3">
              <button
                class="inline-flex items-center gap-2 rounded-lg border bg-background/80 px-4 py-2 font-medium text-sm text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent"
                @click="triggerFileSelect"
              >
                <Archive weight="duotone" class="h-4 w-4" />
                {{ t('select_file') }}
              </button>
              <AppButton
                :disabled="loading"
                class="shadow-sm"
                :class="{ 'animate-pulse-save': !loading }"
                @click="save"
              >
                <Loader2 v-if="loading" weight="duotone" class="h-4 w-4 animate-spin" />
                <Upload v-else weight="duotone" class="h-4 w-4" />
                {{ loading ? t('saving') : t('save_log') }}
              </AppButton>
            </div>
          </div>

          <div
            v-if="error"
            role="alert"
            class="absolute bottom-16 left-4 right-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
