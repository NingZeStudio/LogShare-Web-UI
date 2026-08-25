<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { t } from '@/lib/i18n'
import { apiClient, getApiUrl } from '@/lib/ApiClient'
import { useLogViewer } from '@/composables/useLogViewer'
import { useAiAnalysis } from '@/composables/useAiAnalysis'
import { useLogSearch } from '@/composables/useLogSearch'
import '@/assets/LogsAnalysis.css'
import MarkdownIt from 'markdown-it'
import {
  WrapText,
  Search,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  ArrowUp,
  Code,
  Trash2,
  RefreshCw,
  Loader2,
  X
} from 'lucide-vue-next'

declare global {
  interface HTMLElement {
    _clickOutside?: (event: MouseEvent) => void
  }
}

const route = useRoute()
const id = route.params.id as string

const viewer = useLogViewer(id)
const ai = useAiAnalysis(id)
const search = useLogSearch(
  () => viewer.originalLogText.value,
  (html: string) => {
    viewer.logContent.value = html
  }
)

const md = new MarkdownIt({
  html: false,
  linkify: true
})

const renderMarkdown = (text: string, streaming = false): string => {
  if (!text) return ''
  try {
    const source = streaming ? closeIncompleteMarkdown(text) : text
    return md.render(source)
  } catch {
    return md.utils.escapeHtml(text)
  }
}

const closeIncompleteMarkdown = (text: string): string => {
  const fenceCount = (text.match(/^\s*```/gm) || []).length
  if (fenceCount % 2 === 1) return `${text}\n\n\`\`\``
  return text
}

onMounted(() => {
  viewer.init()
  viewer.loadLog()
})

const showDeleteDialog = ref(false)

const confirmDelete = () => {
  showDeleteDialog.value = false
  viewer.deleteLog()
}

const selectedFile = ref('') // 当前渲染的文件名（API files 列表中的 name）
const fileSwitching = ref(false)

// 文件列表完全来自 GET /v1/log/{id} 的 files 字段
const attachedFiles = computed(() => viewer.logMeta.value?.files ?? [])

watch(attachedFiles, list => {
  // 元信息就绪后默认选中第一项（即主文件），正文初始已是主文件，无需拉取
  if (!selectedFile.value && list.length > 0) {
    selectedFile.value = list[0]!.name
  }
})

const formatBytes = (bytes?: number): string => {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// 由接口实际返回的字段拼接摘要句，未返回的部分不出现在句子里
const logSummary = computed(() => {
  const info = viewer.log.value
  if (!info) return ''

  // 首段使用接口的类型标识（xxxx/xxx 形式），如 vanilla/server
  let head = ''
  if (info.id) head = `这是一份 ${info.id} 日志`
  else if (info.type) head = `这是一份 ${info.type}`
  else if (info.name) head = `这是一份 ${info.name} 日志`
  if (!head) return ''

  const parts: string[] = [head]
  if (info.version) parts.push(`版本是 ${info.version}`)
  for (const item of info.analysis?.information ?? []) {
    if (item.label && item.value) parts.push(`${item.label}是 ${item.value}`)
  }
  return parts.join('，')
})

const HELP_TIP_DISMISS_KEY = 'log_help_tip_dismissed'
const showHelpTip = ref(localStorage.getItem(HELP_TIP_DISMISS_KEY) !== '1')

const dismissHelpTip = () => {
  showHelpTip.value = false
  localStorage.setItem(HELP_TIP_DISMISS_KEY, '1')
}

// AI 面板流式输出自动跟随滚动；用户上滑阅读时暂停，回到底部后恢复
const aiScrollEl = ref<HTMLElement | null>(null)
const aiUserScrolledUp = ref(false)

const onAiScroll = () => {
  const el = aiScrollEl.value
  if (!el) return
  aiUserScrolledUp.value = el.scrollTop + el.clientHeight < el.scrollHeight - 48
}

watch(
  () => [ai.aiStreamingContent.value, ai.aiStatusEntries.value.length],
  async () => {
    if (aiUserScrolledUp.value) return
    await nextTick()
    const el = aiScrollEl.value
    if (el) el.scrollTop = el.scrollHeight
  }
)

watch(ai.showAiPanel, open => {
  if (open) {
    aiUserScrolledUp.value = false
  }
})

const onFileChange = async () => {
  const name = selectedFile.value
  if (!name) return
  fileSwitching.value = true
  try {
    const text = await apiClient.getRawFile(id, name)
    await viewer.applyRawText(text)
  } catch (e: any) {
    console.error('Failed to load attached file:', e)
    viewer.addNotification('error', t('file_load_failed'))
    // 加载失败回退主文件，避免正文与下拉状态不一致
    selectedFile.value = attachedFiles.value[0]?.name || ''
    await viewer.restoreMain()
  } finally {
    fileSwitching.value = false
  }
}

onMounted(() => {
  viewer.init()
  viewer.loadLog()
})
</script>

<template>
  <div v-if="viewer.loading.value" class="container mx-auto px-4 py-12 text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    <p class="mt-4 text-muted-foreground">{{ t('loading_log') }}</p>
  </div>

  <div v-else-if="viewer.error.value" class="container mx-auto px-4 py-12 text-center">
    <h2 class="text-2xl font-bold text-destructive">{{ t('error_title') }}</h2>
    <p class="text-muted-foreground">{{ viewer.error.value }}</p>
  </div>

  <div
    v-else
    :class="
      viewer.isFullscreen.value
        ? 'fixed inset-0 z-50 bg-background transition-all duration-300'
        : 'w-full'
    "
  >
    <div :class="viewer.isFullscreen.value ? 'h-full flex flex-col' : 'flex flex-col'">
      <!-- 标题栏 -->
      <div
        v-if="!viewer.isFullscreen.value"
        class="flex items-start justify-between gap-4 px-4 py-3"
      >
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold break-all">{{ viewer.log.value?.title }}</h1>
          <p v-if="logSummary" class="text-sm text-muted-foreground mt-1">{{ logSummary }}</p>
          <div v-if="attachedFiles.length > 1" class="flex items-center gap-1.5 text-sm mt-1">
            <span class="text-muted-foreground">{{ t('show_current_file') }}:</span>
            <select
              v-model="selectedFile"
              :disabled="fileSwitching"
              class="max-w-56 truncate bg-muted px-1.5 py-0.5 rounded text-xs font-mono cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              @change="onFileChange"
            >
              <option v-for="file in attachedFiles" :key="file.name" :value="file.name">
                {{ file.name }} ({{ formatBytes(file.size) }})
              </option>
            </select>
            <Loader2 v-if="fileSwitching" class="h-3.5 w-3.5 animate-spin text-primary" />
          </div>
        </div>
      </div>

      <!-- 信息卡片区域 -->
      <div v-if="!viewer.isFullscreen.value" class="grid gap-4 md:grid-cols-2 px-4">
        <!-- 问题统计 -->
        <div v-if="viewer.log.value?.analysis?.problems?.length > 0" class="bg-card p-4">
          <div class="flex items-center gap-2 mb-3 pb-3 border-b">
            <AlertTriangle class="h-5 w-5 text-destructive" />
            <h2 class="font-semibold">{{ t('problems_detected') }}</h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertTriangle class="h-4 w-4 text-destructive" />
              <span class="text-sm font-medium">{{
                t('problems_count').replace(
                  '{count}',
                  viewer.log.value.analysis.problems.length.toString()
                )
              }}</span>
            </div>
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20"
            >
              <AlertTriangle class="h-4 w-4 text-warning" />
              <span class="text-sm font-medium">{{
                t('warnings_count').replace(
                  '{count}',
                  viewer.log.value.analysis.problems
                    .filter((p: any) => p.severity === 'warning')
                    .length.toString()
                )
              }}</span>
            </div>
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <Check class="h-4 w-4 text-green-500" />
              <span class="text-sm font-medium">{{
                t('solvable_count').replace(
                  '{count}',
                  viewer.log.value.analysis.problems
                    .filter((p: any) => p.solutions?.length)
                    .length.toString()
                )
              }}</span>
            </div>
          </div>
          <button
            class="w-full mt-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
            @click="
              viewer.problemsSection.value?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              })
            "
          >
            {{ t('view_details') }} ↓
          </button>
        </div>
      </div>

      <!-- 帮助提示（可关闭 Tips） -->
      <div
        v-if="!viewer.isFullscreen.value && showHelpTip"
        class="px-4 mt-3 mb-3 text-sm"
      >
        <div class="relative bg-muted/50 rounded-lg px-4 py-2.5 pr-9 space-y-1.5">
          <span class="font-medium">{{ t('log_help_card_title') }}</span>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              :class="
                viewer.isCopySuccess.value
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              "
              class="inline-flex items-center rounded-md px-3.5 py-2 font-medium transition-colors"
              @click="viewer.copyShareMessage()"
            >
              {{ viewer.isCopySuccess.value ? t('copied') : t('copy_share') }}
            </button>
            <RouterLink
              to="/groups"
              class="inline-flex items-center rounded-md bg-primary/10 text-primary px-3.5 py-2 font-medium transition-colors hover:bg-primary/20"
            >
              {{ t('go_group_list') }}
            </RouterLink>
          </div>
          <button
            class="absolute right-2 top-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            :aria-label="t('close')"
            @click="dismissHelpTip"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- 日志查看器 -->
      <div :class="viewer.isFullscreen.value ? 'flex-1 flex flex-col min-h-0' : ''">
        <!-- 工具栏 -->
        <div class="border-b bg-muted/30">
          <!-- 主工具栏：功能按钮区 -->
          <div class="flex items-center justify-between gap-2 p-2 border-b border-muted">
            <!-- 左侧：视图控制 -->
            <div class="flex items-center gap-1">
              <button
                :class="
                  viewer.showErrorsOnly.value
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : 'bg-secondary/80 hover:bg-secondary text-secondary-foreground'
                "
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium"
                :title="viewer.showErrorsOnly.value ? t('show_all') : t('show_errors_only')"
                @click="viewer.toggleErrors()"
              >
                <AlertTriangle class="h-5 w-5" />
                <span class="hidden sm:inline">{{
                  viewer.showErrorsOnly.value ? t('show_all') : t('show_errors_only')
                }}</span>
              </button>
              <button
                :class="
                  viewer.wrapLines.value
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary/80 hover:bg-secondary text-secondary-foreground'
                "
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium"
                :title="t('toggle_wrap')"
                @click="viewer.wrapLines.value = !viewer.wrapLines.value"
              >
                <WrapText class="h-5 w-5" />
                <span class="hidden sm:inline">{{
                  viewer.wrapLines.value ? t('wrap_lines_on') : t('wrap_lines_off')
                }}</span>
              </button>
              <button
                class="log-analysis-trigger hidden sm:inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                @click="ai.openAiPanel()"
              >
                {{ t('ai_analysis') }}
              </button>
            </div>

            <!-- 右侧：操作按钮 -->
            <div class="flex items-center gap-1">
              <button
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                :title="t('download')"
                @click="viewer.downloadLog()"
              >
                <Download class="h-5 w-5" />
                <span class="hidden sm:inline">{{ t('download') }}</span>
              </button>
              <a
                :href="getApiUrl(`/v1/raw/${id}`)"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                :title="t('view_raw_log')"
              >
                <Code class="h-5 w-5" />
                <span class="hidden sm:inline">{{ t('view_raw_log') }}</span>
              </a>
              <button
                :disabled="viewer.isDeleting.value"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive disabled:opacity-50"
                :title="t('delete')"
                @click="showDeleteDialog = true"
              >
                <Trash2 class="h-5 w-5" />
                <span class="hidden sm:inline">{{
                  viewer.isDeleting.value ? t('deleting') : t('delete')
                }}</span>
              </button>

              <!-- 删除确认对话框 -->
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
                    v-if="showDeleteDialog"
                    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
                    @click.self="showDeleteDialog = false"
                  >
                    <Transition
                      enter-active-class="transition ease-out duration-200"
                      enter-from-class="opacity-0 scale-95"
                      enter-to-class="opacity-100 scale-100"
                      leave-active-class="transition ease-in duration-150"
                      leave-from-class="opacity-100 scale-100"
                      leave-to-class="opacity-0 scale-95"
                    >
                      <div
                        class="bg-card text-card-foreground rounded-lg shadow-2xl max-w-sm w-full overflow-hidden"
                      >
                        <div class="p-5 sm:p-6">
                          <div class="flex items-start gap-3 mb-4">
                            <div
                              class="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0"
                            >
                              <AlertTriangle class="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                              <h2 class="text-lg font-semibold text-foreground">
                                {{ t('delete_log') }}
                              </h2>
                              <p class="text-sm text-muted-foreground mt-1">
                                此操作不可撤销，确定要删除这个日志吗？
                              </p>
                            </div>
                          </div>

                          <div class="flex items-center justify-end gap-2">
                            <button
                              class="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-muted hover:bg-muted/80 text-muted-foreground"
                              :disabled="viewer.isDeleting.value"
                              @click="showDeleteDialog = false"
                            >
                              {{ t('cancel') }}
                            </button>
                            <button
                              class="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50"
                              :disabled="viewer.isDeleting.value"
                              @click="confirmDelete"
                            >
                              {{ viewer.isDeleting.value ? t('deleting') : t('delete') }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </Transition>
              </Teleport>
              <button
                v-if="!viewer.isFullscreen.value"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-all duration-300 px-4 py-2 font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                :title="t('fullscreen')"
                @click="viewer.enterFullscreen()"
              >
                <Maximize2 class="h-5 w-5" />
                <span class="hidden sm:inline">{{ t('fullscreen') }}</span>
              </button>
              <button
                v-else
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-all duration-300 px-4 py-2 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                :title="t('exit_fullscreen')"
                @click="viewer.exitFullscreen()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
                <span class="hidden sm:inline">{{ t('exit_fullscreen') }}</span>
              </button>
              <div class="hidden sm:flex items-center gap-0.5 ml-1">
                <button
                  class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                  :class="{ 'opacity-40': viewer.logFontSize.value <= 10 }"
                  :disabled="viewer.logFontSize.value <= 10"
                  @click="viewer.decreaseFontSize()"
                >
                  −
                </button>
                <input
                  v-if="viewer.isEditingFontSize.value"
                  ref="viewer.fontSizeInputEl"
                  v-model="viewer.fontSizeInput.value"
                  type="number"
                  min="8"
                  max="48"
                  class="w-14 text-center text-sm font-mono bg-background border border-primary rounded px-1 py-0.5 focus:outline-none"
                  @blur="viewer.applyFontSize()"
                  @keydown="viewer.handleFontSizeKeydown($event)"
                />
                <button
                  v-else
                  class="w-10 text-center text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                  @click="viewer.startEditFontSize()"
                >
                  {{ viewer.logFontSize.value }}
                </button>
                <button
                  class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                  :class="{ 'opacity-40': viewer.logFontSize.value >= 24 }"
                  :disabled="viewer.logFontSize.value >= 24"
                  @click="viewer.increaseFontSize()"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- 移动端专用行：字体调节和LogAnalysis按钮 -->
          <div class="flex items-center gap-1 justify-between p-2 border-b border-muted sm:hidden">
            <div class="flex items-center gap-0.5">
              <button
                class="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                :class="{ 'opacity-40': viewer.logFontSize.value <= 10 }"
                :disabled="viewer.logFontSize.value <= 10"
                @click="viewer.decreaseFontSize()"
              >
                −
              </button>
              <input
                v-if="viewer.isEditingFontSize.value"
                v-model="viewer.fontSizeInput.value"
                type="number"
                min="8"
                max="48"
                class="w-12 text-center text-sm font-mono bg-background border border-primary rounded px-1 py-0.5 focus:outline-none"
                @blur="viewer.applyFontSize()"
                @keydown="viewer.handleFontSizeKeydown($event)"
              />
              <button
                v-else
                class="w-8 text-center text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                @click="viewer.startEditFontSize()"
              >
                {{ viewer.logFontSize.value }}
              </button>
              <button
                class="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                :class="{ 'opacity-40': viewer.logFontSize.value >= 24 }"
                :disabled="viewer.logFontSize.value >= 24"
                @click="viewer.increaseFontSize()"
              >
                +
              </button>
            </div>
            <button
              class="log-analysis-trigger inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              @click="ai.openAiPanel()"
            >
              {{ t('ai_analysis') }}
            </button>
          </div>

          <!-- 搜索栏 -->
          <div class="flex items-center gap-2 p-2">
            <div class="flex-1 min-w-0">
              <div class="relative">
                <Search
                  class="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2"
                />
                <input
                  v-model="search.searchTerm.value"
                  :placeholder="t('search') + ' (Ctrl+F)'"
                  class="w-full bg-background border border-border rounded-md pl-9 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  @keyup="search.handleSearchInput($event)"
                />
              </div>
            </div>

            <div v-if="search.searchResults.value.length > 0" class="flex items-center gap-1">
              <span class="text-xs text-muted-foreground font-mono min-w-[60px] text-center"
                >{{ search.searchIndex.value + 1 }}/{{ search.searchResults.value.length }}</span
              >
              <button
                class="p-2 rounded-md hover:bg-secondary transition-colors"
                :title="t('previous_result')"
                @click="search.goToPrevResult()"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button
                class="p-2 rounded-md hover:bg-secondary transition-colors"
                :title="t('next_result')"
                @click="search.goToNextResult()"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 日志内容 -->
        <div :class="viewer.isFullscreen.value ? 'flex-1 flex flex-col min-h-0' : ''">
          <div
            :class="
              viewer.isFullscreen.value ? 'flex-1 overflow-y-auto' : 'overflow-x-auto relative'
            "
            class="bg-[#2a2a2a] py-2"
          >
            <div
              class="log-content font-mono text-gray-100"
              :style="{ fontSize: viewer.logFontSize.value + 'px' }"
              :class="{
                'show-errors-only': viewer.showErrorsOnly.value,
                'log-wrap': viewer.wrapLines.value,
                'log-no-wrap': !viewer.wrapLines.value
              }"
              v-html="viewer.logContent.value"
            ></div>
            <button
              class="fixed bottom-4 right-4 inline-flex items-center gap-1.5 text-xs bg-[#3d3d3d] hover:bg-[#4a4a4a] text-gray-100 px-4 py-2 rounded-md transition-colors shadow-lg"
              @click="viewer.scrollToTop()"
            >
              <ArrowUp class="h-3.5 w-3.5" />
              {{ t('scroll_top') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 问题详情 -->
      <div
        v-if="viewer.log.value?.analysis?.problems?.length > 0"
        ref="viewer.problemsSection"
        class="bg-card p-4"
      >
        <div class="flex items-center gap-2 mb-4 pb-3 border-b">
          <AlertTriangle class="h-5 w-5 text-destructive" />
          <h2 class="font-semibold">{{ t('problem_details') }}</h2>
        </div>
        <div class="space-y-3">
          <div
            v-for="(prob, idx) in viewer.log.value.analysis.problems"
            :key="idx"
            class="p-3 rounded-lg border bg-destructive/5 border-destructive/20"
          >
            <div class="flex items-start gap-2">
              <AlertTriangle class="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">{{ prob.message }}</p>
                <p v-if="prob.line" class="text-xs text-muted-foreground mt-1">
                  {{ t('line_number') }}: {{ prob.line }}
                </p>
                <div v-if="prob.solutions?.length" class="mt-3 space-y-2">
                  <p class="text-xs font-medium text-green-600">{{ t('solution') }}:</p>
                  <div
                    v-for="sol in prob.solutions"
                    :key="sol.message"
                    class="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{{ sol.message }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- AI 分析面板 -->
  <div v-if="ai.showAiPanel.value" class="fixed inset-0 z-50">
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      @click="ai.closeAiPanel()"
    ></div>

    <div
      class="relative ml-auto h-full w-full md:w-[42rem] lg:w-[48rem] bg-background border-l border-border shadow-2xl flex flex-col"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div class="min-w-0">
          <h2 class="font-semibold flex items-center gap-2">
            {{ t('ai_analysis') }}
            <span v-if="ai.aiIsCached.value" class="text-xs text-blue-500 font-normal">
              {{ t('ai_cached_result') }}
            </span>
          </h2>
        </div>
        <button
          class="p-2 rounded-md hover:bg-secondary transition-colors"
          @click="ai.closeAiPanel()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div v-if="ai.aiIsStreaming.value" class="border-b bg-primary/5 px-4 py-3 text-sm">
        <div class="flex items-center gap-2">
          <div class="flex gap-1">
            <div class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
            <div
              class="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse animation-delay-200"
            ></div>
            <div
              class="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse animation-delay-400"
            ></div>
          </div>
          <p class="font-medium">{{ t('ai_analyzing_streaming') }}</p>
        </div>
        <p class="mt-1 text-muted-foreground">
          {{ t('ai_streaming_partial').replace('{count}', ai.aiStreamingLength.value.toString()) }}
        </p>
      </div>

      <div
        ref="aiScrollEl"
        class="flex-1 overflow-y-auto p-4 space-y-3"
        @scroll="onAiScroll"
      >
        <!-- 分析步骤：与正文同一滚动流 -->
        <div
          v-if="ai.aiStatusBlocks.value.length"
          class="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1.5"
        >
          <div v-for="block in ai.aiStatusBlocks.value" :key="block.id">
            <button
              class="w-full flex items-center gap-2 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              :aria-expanded="block.expanded"
              @click="ai.toggleStatusBlock(block.id)"
            >
              <span
                class="h-2 w-2 rounded-full flex-shrink-0"
                :class="block.completed ? 'bg-green-500' : 'bg-primary animate-pulse'"
              ></span>
              <span class="flex-1">{{ block.title }}</span>
              <span class="text-xs">{{ block.expanded ? '收起' : '展开' }}</span>
            </button>
            <div
              v-show="block.expanded"
              class="mt-1 ml-4 rounded-md bg-background/60 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap break-words"
            >
              {{ block.detail || '暂无详细信息' }}
            </div>
          </div>
        </div>

        <div v-if="ai.aiLoading.value && !ai.aiIsStreaming.value" class="flex flex-col items-center justify-center min-h-[300px]">
          <div class="relative w-16 h-16">
            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
            ></div>
            <div
              class="absolute inset-2 rounded-full border-4 border-transparent border-b-primary animate-spin-reverse"
            ></div>
          </div>
          <p class="mt-6 text-muted-foreground text-sm">{{ t('ai_analyzing') }}</p>
        </div>

        <div v-else-if="ai.aiError.value" class="py-8 text-center">
          <p class="text-sm text-red-500">{{ ai.aiError.value }}</p>
          <pre
            v-if="ai.aiRawError.value"
            class="mt-4 max-h-48 overflow-auto rounded-lg bg-[#1e1e1e] p-3 text-left text-xs text-gray-100 font-mono whitespace-pre-wrap break-all leading-relaxed"
            >{{ ai.aiRawError.value }}</pre
          >
          <button
            class="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
            @click="ai.loadAiAnalysis()"
          >
            <RefreshCw class="h-3.5 w-3.5" />
            {{ t('ai_analysis_retry') }}
          </button>
        </div>

        <div v-else-if="ai.hasAiContent.value">
          <div class="rounded-xl border bg-card p-3">
            <div
              class="ai-markdown-body prose prose-sm dark:prose-invert max-w-none break-words"
              v-html="
                renderMarkdown(
                  ai.aiIsStreaming.value ? ai.aiStreamingContent.value : ai.aiText.value,
                  ai.aiIsStreaming.value
                )
              "
            ></div>
            <span
              v-if="ai.aiIsStreaming.value"
              class="ai-streaming-cursor"
              aria-hidden="true"
            ></span>
          </div>
        </div>

        <div v-else-if="!ai.aiLoading.value" class="py-12 text-center">
          <p class="text-muted-foreground text-sm">{{ t('ai_empty_result') }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 通知组件 -->
  <div class="fixed top-24 right-4 z-50 space-y-2">
    <TransitionGroup name="notification">
      <div
        v-for="notification in viewer.notifications.value"
        :key="notification.id"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg bg-card min-w-[300px]"
        :class="notification.type === 'success' ? 'border-green-500/50' : 'border-destructive/50'"
      >
        <Check
          v-if="notification.type === 'success'"
          class="h-5 w-5 text-green-500 flex-shrink-0"
        />
        <AlertTriangle v-else class="h-5 w-5 text-destructive flex-shrink-0" />
        <span class="text-sm flex-1">{{ notification.message }}</span>
        <button
          class="text-gray-400 hover:text-white"
          @click="viewer.removeNotification(notification.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
.log-analysis-trigger {
  border: 1px solid hsl(var(--primary) / 0.25);
  background: linear-gradient(180deg, hsl(var(--primary) / 0.16), hsl(var(--primary) / 0.08));
  color: hsl(var(--primary));
  box-shadow: inset 0 1px 0 hsl(var(--primary) / 0.12);
}

.log-analysis-trigger:hover {
  background: linear-gradient(180deg, hsl(var(--primary) / 0.22), hsl(var(--primary) / 0.12));
}

.ai-streaming-cursor {
  display: inline-block;
  width: 0.45rem;
  height: 1rem;
  margin-left: 0.2rem;
  vertical-align: -0.15rem;
  background: hsl(var(--primary));
  animation: ai-cursor-blink 0.9s steps(2) infinite;
}

@keyframes ai-cursor-blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-streaming-cursor {
    animation: none;
  }
}

/* AI 正文 Markdown 渲染增强 */
.ai-markdown-body :is(table) {
  display: block;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.ai-markdown-body th,
.ai-markdown-body td {
  white-space: nowrap;
  border: 1px solid hsl(var(--border));
  padding: 0.375rem 0.625rem;
}

.ai-markdown-body pre {
  overflow-x: auto;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: #1e1e1e;
}

.ai-markdown-body code:not(pre code) {
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.3125rem;
  border-radius: 0.25rem;
}

.ai-markdown-body hr {
  border-color: hsl(var(--border));
}

.ai-markdown-body img {
  max-width: 100%;
  height: auto;
}

.log-content table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.log-content .line-num {
  vertical-align: top;
  text-align: right;
  width: 45px;
  font-size: inherit;
  color: #6b7280;
  line-height: inherit;
  padding-right: 8px;
  border-right: 1px solid #3d3d3d;
  margin-right: 8px;
  user-select: none;
}

.log-content .line-content {
  padding: 0;
  margin: 0;
  word-break: break-all;
  vertical-align: top;
}

.log-content.show-errors-only .entry-no-error {
  display: none;
}

.log-no-wrap {
  white-space: pre;
  overflow-x: auto;
}

.log-no-wrap table {
  width: auto;
  table-layout: auto;
}

.log-no-wrap .line-content {
  word-break: normal;
  overflow-wrap: normal;
}

.log-no-wrap .level {
  white-space: pre !important;
}

.log-content tr.bg-error-group {
  background-color: rgba(239, 68, 68, 0.12) !important;
}

.log-content tr.bg-warning-group {
  background-color: rgba(245, 158, 11, 0.12) !important;
}

.dark .log-content tr.bg-error-group {
  background-color: rgba(239, 68, 68, 0.18) !important;
}

.dark .log-content tr.bg-warning-group {
  background-color: rgba(245, 158, 11, 0.18) !important;
}

mark {
  padding: 0.1em 0.2em;
  margin: 0;
  background-color: #3b82f6;
  color: #ffffff;
  border-radius: 2px;
  font-weight: 500;
}

.dark mark {
  background-color: #60a5fa;
  color: #000000;
}

.log-wrap {
  white-space: normal;
}

.log-no-wrap {
  white-space: pre;
}

.fullscreen-log-view {
  overflow: hidden;
}

.fullscreen-view-enter-active,
.fullscreen-view-leave-active {
  transition: all 0.3s ease;
}

.fullscreen-view-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.fullscreen-view-enter-to {
  opacity: 1;
  transform: scale(1);
}

.fullscreen-view-leave-from {
  opacity: 1;
  transform: scale(1);
}

.fullscreen-view-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.log-content {
  font-family: var(--font-mono);
  font-weight: 500;
  line-height: 1.15;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  letter-spacing: 0.02em;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.log-content * {
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: inherit;
}

.log-content p {
  line-height: inherit;
  margin: 0;
}

@media (max-width: 767px) {
  .log-content .line-num {
    width: 35px;
    padding-right: 6px;
    margin-right: 6px;
  }
}

@media (min-width: 1024px) {
  .log-content .line-num {
    width: 50px;
    padding-right: 10px;
    margin-right: 10px;
  }
}

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

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}

.animate-spin-reverse {
  animation: spin-reverse 1s linear infinite;
}

@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
</style>
