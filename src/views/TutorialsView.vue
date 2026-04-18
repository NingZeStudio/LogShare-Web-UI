<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { t } from '@/lib/i18n'

const tutorials = [
  {
    id: 'ask-questions-effectively',
    title: '如何有效地提问求助指南',
    description: '学会正确的提问方法，提高获得帮助的概率，建立良好的社区关系',
    category: '社区指南',
    author: '社区经验总结'
  },
  {
    id: 'mobileglues-setup',
    title: '关于 FoldCraftLauncher 和 ZalithLauncher2 使用 MobileGlues 渲染器',
    description: '在 Android 设备上配置 MobileGlues 渲染器，提升 Minecraft 游戏性能和兼容性',
    category: '客户端配置',
    author: '用户提供内容'
  },
  {
    id: 'server-log-analysis',
    title: '服务器日志分析与问题排查指南',
    description: '学习如何分析 Minecraft 服务器日志，快速定位和解决常见问题',
    category: '服务器管理',
    author: 'Qwen 3.5 Plus'
  },
  {
    id: 'api-integration',
    title: 'LogShare API 集成指南',
    description: '将 LogShare API 集成到您的服务器面板或自动化工作流中',
    category: '开发集成',
    author: 'Qwen 3.5 Plus'
  }
]
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- 页面头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">{{ t('tutorials_center') }}</h1>
      <p class="text-muted-foreground">
        {{ t('tutorials_description') }}
      </p>
    </div>

    <!-- 教程列表 -->
    <div class="space-y-3">
      <RouterLink
        v-for="tutorial in tutorials"
        :key="tutorial.id"
        :to="`/tutorials/${tutorial.id}`"
        class="group block bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold mb-1 group-hover:text-primary transition-colors">
              {{ tutorial.title }}
            </h3>
            <p class="text-sm text-muted-foreground mb-2">
              {{ tutorial.description }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {{ tutorial.category }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ tutorial.author }}
              </span>
            </div>
          </div>
          <ChevronRight
            class="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0"
          />
        </div>
      </RouterLink>
    </div>

    <!-- 快速链接 -->
    <div class="mt-8 p-4 bg-muted/30 rounded-lg border border-border">
      <h2 class="text-sm font-semibold mb-2">{{ t('need_help') }}</h2>
      <div class="flex flex-wrap gap-3 text-xs">
        <RouterLink to="/api-docs" class="text-primary hover:underline">
          {{ t('view_api_docs') }}
        </RouterLink>
        <span class="text-muted-foreground">|</span>
        <a
          href="https://qm.qq.com/q/XoXSt8askA"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline"
        >
          {{ t('join_qq_group_link') }}
        </a>
      </div>
    </div>
  </div>
</template>
