<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ref } from 'vue'
import { wafBlockState, hideWafBlock } from '@/lib/wafBlock'

const iframeRef = ref<HTMLIFrameElement | null>(null)

/**
 * 按卡片实际高度校准 iframe：卡片由 WAF 返回、高度随文案/断点变化，
 * 固定高度会留白（内容偏左上）。sandbox 需带 allow-same-origin 才能读取
 * 内部文档尺寸；不含 allow-scripts，卡片内脚本不会执行。
 */
const syncHeight = () => {
  const doc = iframeRef.value?.contentDocument
  const height = doc?.body?.scrollHeight
  if (height) {
    iframeRef.value!.style.height = `${height}px`
  }
}

const close = () => hideWafBlock()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="wafBlockState.open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="请求被安全系统拦截"
        @click.self="close"
      >
        <div class="relative w-full max-w-[560px]">
          <button
            type="button"
            class="absolute -top-10 right-0 rounded-md p-1.5 text-white/70 transition-colors hover:text-white"
            aria-label="关闭"
            @click="close"
          >
            <X class="size-5" />
          </button>
          <!-- WAF 卡片自带全部样式，iframe srcdoc 原样渲染（无 allow-scripts，卡片为纯静态内容） -->
          <iframe
            ref="iframeRef"
            class="w-full bg-white"
            :srcdoc="wafBlockState.html"
            sandbox="allow-same-origin"
            title="OpenLiteWaf 安全提示"
            @load="syncHeight"
          ></iframe>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
