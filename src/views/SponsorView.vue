<script setup lang="ts">
import { computed } from 'vue'
import { Heart, QrCode, DollarSign } from 'lucide-vue-next'
import { sponsors, sponsorConfig, getTotalAmount, getSponsorCount, getPlatformIcon, getPlatformColor } from '@/data/sponsors'
import { t } from '@/lib/i18n'
import { setPageTitle } from '@/lib/pageTitle'

setPageTitle('sponsor')

const totalAmount = computed(() => getTotalAmount())
const sponsorCount = computed(() => getSponsorCount())

const sortedSponsors = computed(() => {
  return [...sponsors].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- 页面头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">{{ t('sponsor_title') }}</h1>
      <p class="text-muted-foreground">
        {{ t('sponsor_description') }}
      </p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="group block bg-card border border-border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-red-500/10 rounded-md">
            <Heart class="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">赞助人数</p>
            <p class="text-xl font-bold">{{ sponsorCount }}</p>
          </div>
        </div>
      </div>
      <div class="group block bg-card border border-border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-500/10 rounded-md">
            <DollarSign class="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">赞助总额</p>
            <p class="text-xl font-bold">¥{{ totalAmount }}</p>
          </div>
        </div>
      </div>
      <div class="group block bg-card border border-border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-500/10 rounded-md">
            <QrCode class="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">支持方式</p>
            <p class="text-xl font-bold">2</p>
          </div>
        </div>
      </div>
      <div class="group block bg-card border border-border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-500/10 rounded-md">
            <Heart class="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">感谢有您</p>
            <p class="text-xl font-bold">❤️</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 赞助方式 -->
    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <!-- 支付宝 -->
      <div class="group block bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-blue-500/10 rounded-md">
            <QrCode class="h-4 w-4 text-blue-500" />
          </div>
          <h2 class="text-base font-semibold">{{ t('sponsor_alipay') }}</h2>
        </div>

        <div class="bg-muted/50 rounded-md flex items-center justify-center mb-3 overflow-hidden min-h-[240px] border">
          <img
            :src="sponsorConfig.alipayQrCode"
            alt="支付宝"
            class="max-w-full h-auto object-contain p-4"
            @error="(e) => { const target = e.target as HTMLImageElement; if (target) target.style.display = 'none' }"
          />
        </div>
        <p class="text-sm text-center text-muted-foreground">
          {{ t('sponsor_scan_to_sponsor') }}
        </p>
      </div>

      <!-- 微信 -->
      <div class="group block bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-green-500/10 rounded-md">
            <QrCode class="h-4 w-4 text-green-500" />
          </div>
          <h2 class="text-base font-semibold">{{ t('sponsor_wechat') }}</h2>
        </div>

        <div class="bg-muted/50 rounded-md flex items-center justify-center mb-3 overflow-hidden min-h-[240px] border">
          <img
            :src="sponsorConfig.wechatQrCode"
            alt="微信"
            class="max-w-full h-auto object-contain p-4"
            @error="(e) => { const target = e.target as HTMLImageElement; if (target) target.style.display = 'none' }"
          />
        </div>
        <p class="text-sm text-center text-muted-foreground">
          {{ t('sponsor_scan_to_sponsor') }}
        </p>
      </div>
    </div>

    <!-- 赞助者列表 -->
    <div class="bg-card border border-border rounded-lg">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500/10 rounded-md">
              <Heart class="h-4 w-4 text-amber-500" />
            </div>
            <h2 class="text-base font-semibold">{{ t('sponsor_list') }}</h2>
          </div>
          <div class="text-sm text-muted-foreground">
            <span class="font-medium text-foreground">{{ sponsorCount }}</span>
            {{ t('sponsor_count_unit') }}
            <span class="mx-2">·</span>
            <span class="font-medium text-foreground">¥{{ totalAmount }}</span>
          </div>
        </div>
      </div>

      <div v-if="sortedSponsors.length > 0" class="divide-y">
        <div
          v-for="sponsor in sortedSponsors"
          :key="sponsor.id"
          class="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
        >
          <!-- 头像/图标 -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center shrink-0 border">
            <span class="text-sm font-bold text-primary">{{ sponsor.name.charAt(0).toUpperCase() }}</span>
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium">{{ sponsor.name }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', getPlatformColor(sponsor.platform)]">
                {{ getPlatformIcon(sponsor.platform) }}
              </span>
            </div>
            <p v-if="sponsor.message" class="text-sm text-muted-foreground truncate">
              {{ sponsor.message }}
            </p>
            <p v-else class="text-sm text-muted-foreground">
              {{ sponsor.date }}
            </p>
          </div>

          <!-- 金额 -->
          <div class="text-right shrink-0">
            <span class="text-lg font-bold text-red-500">¥{{ sponsor.amount }}</span>
            <p class="text-xs text-muted-foreground mt-0.5">{{ sponsor.date }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <Heart class="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p class="text-sm text-muted-foreground">{{ t('sponsor_no_sponsors') }}</p>
      </div>
    </div>

    <!-- 底部感谢 -->
    <div class="mt-6 p-4 bg-muted/30 rounded-lg border border-border text-center text-sm text-muted-foreground">
      <div class="flex items-center justify-center gap-2 mb-1">
        <Heart class="h-4 w-4 text-red-500" />
        <span class="font-medium">{{ t('sponsor_footer_thanks') }}</span>
      </div>
      <p>{{ t('sponsor_footer_note') }}</p>
    </div>
  </div>
</template>
