<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
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
  <AppDialog :open="wafBlockState.open" width="2xl" @close="close">
    <div class="p-4">
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
  </AppDialog>
</template>
