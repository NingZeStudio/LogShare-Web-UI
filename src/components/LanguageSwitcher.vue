<template>
  <div class="language-switcher">
    <button @click="toggleLanguageMenu" class="language-button" aria-label="切换语言">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    </button>

    <Transition name="menu-fade" appear>
      <div v-if="showMenu" class="language-menu" ref="menuRef">
        <TransitionGroup name="list">
          <div
            key="zh-CN"
            class="language-option"
            :class="{ active: currentLang === 'zh-CN' }"
            @click="switchLanguage('zh-CN')"
          >
            简体中文
          </div>
          <div
            key="zh-TW"
            class="language-option"
            :class="{ active: currentLang === 'zh-TW' }"
            @click="switchLanguage('zh-TW')"
          >
            繁體中文
          </div>
        </TransitionGroup>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { detectSystemLanguage } from '@/lib/i18n';

const showMenu = ref(false);
const currentLang = ref(detectSystemLanguage());
const menuRef = ref<HTMLDivElement | null>(null);

const toggleLanguageMenu = () => {
  showMenu.value = !showMenu.value;
};

const switchLanguage = (lang: 'zh-CN' | 'zh-TW') => {
  currentLang.value = lang;
  localStorage.setItem('preferred_language', lang);
  showMenu.value = false;

  window.location.reload();
};

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    showMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-block;
}

.language-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.language-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.dark .language-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.language-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 120px;
  margin-top: 4px;
  overflow: hidden;
}

.language-option {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background-color 0.2s;
}

.language-option:last-child {
  border-bottom: none;
}

.language-option:hover {
  background-color: var(--muted);
}

.language-option.active {
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-weight: 500;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
