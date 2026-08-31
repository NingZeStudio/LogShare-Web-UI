<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { wafBlockState, hideWafBlock } from '@/lib/wafBlock'

/**
 * OpenLiteWaf 拦截卡片弹窗。
 *
 * WAF 返回 403 时响应体是一段无外壳的 HTML 卡片组件（见 OpenLiteWaf
 * 的 WARN_HTML 模板），这里用 iframe srcdoc 隔离渲染：卡片自带 scoped
 * 样式，与站点样式（Tailwind preflight、暗色模式）完全隔离，语义上
 * 也等同 WAF 独立返回的页面。
 */
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
        <div class="relative w-full max-w-[600px]">
          <button
            type="button"
            class="absolute -top-10 right-0 rounded-md p-1.5 text-white/70 transition-colors hover:text-white"
            aria-label="关闭"
            @click="close"
          >
            <X class="size-5" />
          </button>
          <!-- WAF 卡片自带全部样式，iframe srcdoc 原样渲染（sandbox 全禁，卡片为纯静态内容） -->
          <iframe
            class="h-[150px] w-full bg-white"
            :srcdoc="wafBlockState.html"
            sandbox=""
            title="OpenLiteWaf 安全提示"
          ></iframe>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
