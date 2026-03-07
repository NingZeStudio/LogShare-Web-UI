<script setup lang="ts">
import { ref, computed } from 'vue'
import { Heart, QrCode, ExternalLink, Coffee, Sparkles } from 'lucide-vue-next'
import { sponsors, sponsorConfig, getTotalAmount, getSponsorCount, getPlatformIcon, getPlatformColor } from '@/data/sponsors'
import { t } from '@/lib/i18n'
import { setPageTitle } from '@/lib/pageTitle'

setPageTitle('sponsor')

const selectedQrCode = ref<'alipay' | 'wechat'>('alipay')

const totalAmount = computed(() => getTotalAmount())
const sponsorCount = computed(() => getSponsorCount())
const progressPercent = computed(() => {
  if (!sponsorConfig.goal) return 0
  return Math.min(100, Math.round((totalAmount.value / sponsorConfig.goal) * 100))
})

const sortedSponsors = computed(() => {
  return [...sponsors].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- 标题区域 -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <Heart class="h-6 w-6 text-red-500" />
          </div>
        </div>
        <h1 class="text-3xl font-bold mb-3 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          {{ t('sponsor_title') }}
        </h1>
        <p class="text-muted-foreground text-sm max-w-md mx-auto">
          {{ t('sponsor_description') }}
        </p>
      </div>

      <!-- 目标进度卡片 -->
      <div v-if="sponsorConfig.goal" class="bg-card border rounded-2xl p-6 mb-6 shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Coffee class="h-5 w-5 text-amber-500" />
            <span class="font-semibold">{{ t('sponsor_monthly_goal') }}</span>
          </div>
          <div class="text-right">
            <span class="text-2xl font-bold text-red-500">¥{{ totalAmount }}</span>
            <span class="text-muted-foreground text-sm"> / ¥{{ sponsorConfig.goal }}</span>
          </div>
        </div>
        <div class="relative h-3 bg-secondary rounded-full overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{{ t('sponsor_current') }}: ¥{{ totalAmount }}</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <p class="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Sparkles class="h-3 w-3" />
          {{ t('sponsor_goal_desc') }}
        </p>
      </div>

      <!-- 赞助方式 -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- 二维码赞助 -->
        <div class="bg-card border rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-2 bg-blue-500/10 rounded-lg">
              <QrCode class="h-5 w-5 text-blue-500" />
            </div>
            <h2 class="text-lg font-semibold">{{ t('sponsor_qrcode') }}</h2>
          </div>

          <!-- 切换按钮 -->
          <div class="flex gap-2 mb-4">
            <button
              @click="selectedQrCode = 'alipay'"
              :class="[
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                selectedQrCode === 'alipay'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              ]"
            >
              支付宝
            </button>
            <button
              @click="selectedQrCode = 'wechat'"
              :class="[
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                selectedQrCode === 'wechat'
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              ]"
            >
              微信
            </button>
          </div>

          <!-- 二维码显示 -->
          <div class="aspect-square bg-secondary/50 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
            <img
              :src="selectedQrCode === 'alipay' ? sponsorConfig.alipayQrCode : sponsorConfig.wechatQrCode"
              :alt="selectedQrCode === 'alipay' ? '支付宝' : '微信'"
              class="w-full h-full object-contain p-4"
              @error="(e) => { const target = e.target as HTMLImageElement; if (target) target.style.display = 'none' }"
            />
            <div v-if="(!sponsorConfig.alipayQrCode || !sponsorConfig.wechatQrCode)" class="text-center p-4">
              <QrCode class="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p class="text-sm text-muted-foreground">{{ t('sponsor_qrcode_placeholder') }}</p>
            </div>
          </div>
          <p class="text-xs text-center text-muted-foreground">
            {{ selectedQrCode === 'alipay' ? '支付宝' : '微信 }}扫码赞助
          </p>
        </div>

        <!-- 爱发电 -->
        <div class="bg-card border rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles class="h-5 w-5 text-purple-500" />
            </div>
            <h2 class="text-lg font-semibold">{{ t('sponsor_afdian') }}</h2>
          </div>

          <div class="aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl flex items-center justify-center mb-3">
            <div class="text-center p-6">
              <Sparkles class="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <p class="text-sm text-muted-foreground mb-4">{{ t('sponsor_afdian_desc') }}</p>
              <a
                v-if="sponsorConfig.afdianLink"
                :href="sponsorConfig.afdianLink"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-md shadow-purple-500/30 hover:shadow-lg hover:-translate-y-0.5"
              >
                <ExternalLink class="h-4 w-4" />
                {{ t('sponsor_goto_afdian') }}
              </a>
            </div>
          </div>
          <p class="text-xs text-center text-muted-foreground">
            {{ t('sponsor_afdian_note') }}
          </p>
        </div>
      </div>

      <!-- 赞助者列表 -->
      <div class="bg-card border rounded-2xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-amber-500/10 rounded-lg">
              <Heart class="h-5 w-5 text-amber-500" />
            </div>
            <h2 class="text-lg font-semibold">{{ t('sponsor_list') }}</h2>
          </div>
          <div class="text-sm text-muted-foreground">
            {{ sponsorCount }} {{ t('sponsor_count_unit') }} · ¥{{ totalAmount }}
          </div>
        </div>

        <div v-if="sortedSponsors.length > 0" class="space-y-3">
          <div
            v-for="sponsor in sortedSponsors"
            :key="sponsor.id"
            class="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <!-- 头像/图标 -->
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold text-primary">{{ sponsor.name.charAt(0).toUpperCase() }}</span>
            </div>

            <!-- 信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ sponsor.name }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', getPlatformColor(sponsor.platform)]">
                  {{ getPlatformIcon(sponsor.platform) }}
                </span>
              </div>
              <p v-if="sponsor.message" class="text-xs text-muted-foreground truncate mt-0.5">
                {{ sponsor.message }}
              </p>
              <p v-else class="text-xs text-muted-foreground mt-0.5">
                {{ sponsor.date }}
              </p>
            </div>

            <!-- 金额 -->
            <div class="text-right shrink-0">
              <span class="text-lg font-bold text-red-500">¥{{ sponsor.amount }}</span>
              <p class="text-xs text-muted-foreground">{{ sponsor.date }}</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <Heart class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p class="text-sm text-muted-foreground">{{ t('sponsor_no_sponsors') }}</p>
        </div>
      </div>

      <!-- 底部感谢 -->
      <div class="text-center mt-8 text-sm text-muted-foreground">
        <p class="flex items-center justify-center gap-1.5">
          <Heart class="h-4 w-4 text-red-500" />
          {{ t('sponsor_footer_thanks') }}
        </p>
        <p class="mt-1">{{ t('sponsor_footer_note') }}</p>
      </div>
    </div>
  </div>
</template>
