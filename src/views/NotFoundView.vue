<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { FileQuestion, Home, ArrowLeft } from 'lucide-vue-next'
import { setPageTitle } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'
import { onMounted } from 'vue'

onMounted(() => {
  setPageTitle('404')
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
    <div class="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5">
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      ></div>
    </div>

    <div class="text-center space-y-8 max-w-2xl">
      <div class="relative">
        <div class="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
        <div
          class="relative bg-card border border-primary/20 rounded-2xl p-8 inline-block shadow-2xl"
        >
          <FileQuestion class="h-24 w-24 text-primary" />
        </div>
      </div>

      <div class="space-y-4">
        <h1 class="text-8xl font-black text-primary">404</h1>
        <h2 class="text-3xl font-bold text-foreground">{{ t('page_not_found') }}</h2>
        <p class="text-lg text-muted-foreground max-w-md mx-auto">
          {{ t('page_not_found_desc') }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <RouterLink
          to="/"
          class="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
        >
          <Home class="h-5 w-5" />
          {{ t('back_to_home') }}
        </RouterLink>
        <button
          class="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-medium hover:bg-secondary/80 transition-colors border border-border"
          @click="$router.back()"
        >
          <ArrowLeft class="h-5 w-5" />
          {{ t('back_to_previous') }}
        </button>
      </div>

      <div class="pt-8 border-t border-border">
        <p class="text-sm text-muted-foreground">
          {{ t('contact_admin_hint') }}
        </p>
      </div>
    </div>
  </div>
</template>
