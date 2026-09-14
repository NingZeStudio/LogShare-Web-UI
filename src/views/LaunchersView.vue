<script setup lang="ts">
import { integratedLaunchers } from '@/data/launchers'
import AppButton from '@/components/ui/AppButton.vue'
import { setPageTitle } from '@/lib/pageTitle'
import {
  PhRocketLaunch as Rocket,
  PhGithubLogo as Github,
  PhArrowSquareOut as ExternalLink,
  PhDeviceMobile as MobileIcon,
  PhDesktop as DesktopIcon,
  PhGameController as ControllerIcon,
  PhCheckCircle as CheckCircle,
  PhCode as CodeIcon,
  PhLightning as ZapIcon
} from '@phosphor-icons/vue'

setPageTitle('launchers')

const getPlatformIcon = (platforms: string[]) => {
  if (platforms.includes('HarmonyOS NEXT') || platforms.includes('Android')) {
    return MobileIcon
  }
  if (platforms.includes('SteamOS')) {
    return ControllerIcon
  }
  return DesktopIcon
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl space-y-10">
    <!-- 标头 Hero 区 -->
    <header class="space-y-3">
      <div
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold"
      >
        <Rocket weight="duotone" class="h-3.5 w-3.5" />
        <span>开源生态共建</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-foreground">已接入的启动器</h1>
      <p class="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
        作为 Minecraft 中文社区的标准日志分析与分享基础设施，LogShare
        已被多家主流移动端、掌机及桌面启动器原生接入。玩家在遭遇崩溃时，无需繁琐复制，即可一键生成脱敏分享链接并获得专业报错诊断。
      </p>
    </header>

    <!-- 关键指标条 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-xl border border-border bg-card p-4 space-y-1">
        <span class="text-xs text-muted-foreground">已接入客户端</span>
        <div class="text-2xl font-black text-foreground">5+ 款</div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4 space-y-1">
        <span class="text-xs text-muted-foreground">覆盖生态平台</span>
        <div class="text-2xl font-black text-foreground">全平台</div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4 space-y-1">
        <span class="text-xs text-muted-foreground">API 接入耗时</span>
        <div class="text-2xl font-black text-foreground">&lt; 10 分钟</div>
      </div>
      <div class="rounded-xl border border-border bg-card p-4 space-y-1">
        <span class="text-xs text-muted-foreground">调用费用与门槛</span>
        <div class="text-2xl font-black text-foreground">完全免费</div>
      </div>
    </div>

    <!-- 启动器卡片列表 -->
    <section class="space-y-4">
      <h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
        <span>生态启动器矩阵</span>
        <span class="text-xs text-muted-foreground font-normal"
          >({{ integratedLaunchers.length }})</span
        >
      </h2>

      <div class="grid grid-cols-1 gap-5">
        <div
          v-for="launcher in integratedLaunchers"
          :key="launcher.id"
          class="group rounded-xl border border-border/80 bg-card p-5 sm:p-6 transition-all duration-300 ease-bounce-soft hover:border-foreground/20 hover:shadow-soft flex flex-col justify-between gap-5"
        >
          <!-- 头部：标题、简称、标签、平台 -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <img
                  v-if="launcher.logo"
                  :src="launcher.logo"
                  :alt="launcher.name"
                  class="h-10 w-10 rounded-xl object-contain border border-border/80 shadow-soft bg-background shrink-0 p-0.5"
                  loading="lazy"
                />
                <div
                  v-else
                  class="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm shrink-0"
                >
                  <component
                    :is="getPlatformIcon(launcher.platform)"
                    weight="duotone"
                    class="h-5 w-5"
                  />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-bold text-foreground">{{ launcher.name }}</h3>
                    <span
                      class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium"
                    >
                      {{ launcher.shortName }}
                    </span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ launcher.slogan }}</p>
                </div>
              </div>

              <!-- 平台 Badge 徽章 -->
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="plat in launcher.platform"
                  :key="plat"
                  class="text-[11px] font-mono px-2 py-0.5 rounded-full border border-border/80 bg-muted/40 text-muted-foreground"
                >
                  {{ plat }}
                </span>
              </div>
            </div>

            <!-- 详细介绍 -->
            <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {{ launcher.description }}
            </p>

            <!-- 接入 LogShare 方式说明 -->
            <div
              class="rounded-lg border border-border/60 bg-muted/20 p-3 flex items-start gap-2.5"
            >
              <CheckCircle weight="duotone" class="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div class="text-xs space-y-0.5">
                <span class="font-semibold text-foreground">LogShare 接入特性：</span>
                <span class="text-muted-foreground">{{ launcher.integration }}</span>
              </div>
            </div>

            <!-- 标签 -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span
                v-for="tag in launcher.tags"
                :key="tag"
                class="text-[11px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground"
              >
                # {{ tag }}
              </span>
            </div>
          </div>

          <!-- 底部操作按钮 -->
          <div
            class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40"
          >
            <span class="text-xs text-muted-foreground flex items-center gap-1.5">
              <ZapIcon weight="duotone" class="h-3.5 w-3.5 text-amber-500" />
              <span>官方认证接入</span>
            </span>

            <div class="flex items-center gap-2">
              <AppButton
                v-if="launcher.github"
                as="a"
                variant="outline"
                size="sm"
                :href="launcher.github"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github weight="duotone" class="h-3.5 w-3.5" />
                <span>GitHub</span>
              </AppButton>

              <AppButton
                v-if="launcher.website"
                as="a"
                variant="soft"
                size="sm"
                :href="launcher.website"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>访问官网</span>
                <ExternalLink weight="duotone" class="h-3.5 w-3.5" />
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 开发者接入指南与号召 -->
    <div class="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-4">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <CodeIcon weight="duotone" class="h-5 w-5" />
        </div>
        <div>
          <h3 class="text-base font-bold text-foreground">在您的启动器中接入 LogShare</h3>
          <p class="text-xs text-muted-foreground">
            仅需一次 HTTP POST 调用，即可拥有完整的日志托管与高亮诊断能力
          </p>
        </div>
      </div>

      <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        无论是基于 Kotlin / Java 的移动端启动器、基于 Rust / Go 的原生客户端，还是基于 Electron /
        Tauri 的桌面端工具，LogShare 均提供极致轻量、高可用、自动脱敏的公有
        API。无并发配额阻断，完全免费开放。
      </p>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <AppButton as="router-link" to="/api-docs" variant="primary" size="sm">
          <span>查看 API 接入文档</span>
          <ExternalLink weight="duotone" class="h-3.5 w-3.5" />
        </AppButton>
        <AppButton
          as="a"
          href="https://github.com/NingZeStudio/LogShare"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="sm"
        >
          <Github weight="duotone" class="h-3.5 w-3.5" />
          <span>查看后端开源实现</span>
        </AppButton>
      </div>
    </div>
  </div>
</template>
