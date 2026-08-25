<script setup lang="ts">
import {
  officialGroups,
  launcherGroups,
  communityGroups,
  channelGroups,
  type QqGroup
} from '@/data/groups'

const sections: Array<{ title: string; groups: QqGroup[] }> = [
  { title: '官方群', groups: officialGroups },
  { title: '各启动器群', groups: launcherGroups },
  { title: '玩家社区', groups: communityGroups },
  { title: '频道', groups: channelGroups }
]
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-3xl">
    <header class="mb-6">
      <h1 class="text-3xl font-bold mb-2">群列表</h1>
      <p class="text-sm text-muted-foreground mt-1">
        遇到问题？加入对应的群获取帮助。加群前请先阅读教程中心的提问技巧。
      </p>
    </header>

    <section v-for="section in sections" :key="section.title" class="mb-8">
      <h2 class="text-sm font-semibold text-muted-foreground mb-3">{{ section.title }}</h2>
      <div class="space-y-2">
        <div
          v-for="group in section.groups"
          :key="group.url"
          class="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
        >
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium truncate">{{ group.name }}</div>
            <div v-if="group.description" class="text-xs text-muted-foreground mt-0.5">
              {{ group.description }}
            </div>
          </div>
          <a
            :href="group.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center rounded-md bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/20 shrink-0"
          >
            加入群聊
          </a>
        </div>
      </div>
    </section>

    <p class="text-xs text-muted-foreground">
      想收录你的启动器官方群？联系我们。
    </p>
  </div>
</template>
