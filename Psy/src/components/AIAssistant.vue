<template>
  <div class="ai-assistant-wrapper">
    <div
      ref="assistantIcon"
      class="ai-assistant-icon"
      @mouseenter="showPanel = true"
      @click="goToChat('')"
    >
      <div class="icon-inner">
        <img :src="currentIcon" alt="AI助手" />
      </div>
    </div>

    <Transition name="slide">
      <div
        v-show="showPanel"
        class="ai-search-panel"
        @mouseleave="handlePanelLeave"
        @mouseenter="clearHideTimer"
      >
        <div class="suggestions" v-if="!searchQuery">
          <div class="suggestions-title">热门话题</div>
          <div class="suggestions-list">
            <span
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="suggestion-tag"
              @click="goToChat(suggestion)"
            >
              {{ suggestion }}
            </span>
          </div>
        </div>

        <div class="search-box">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="搜索心理学问题..."
            @keyup.enter="handleSearch"
            @focus="showPanel = true"
          />
          <button class="search-btn" @click="handleSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showPanel = ref(false)
const searchQuery = ref('')
const hideTimer = ref<NodeJS.Timeout | null>(null)
const assistantIcon = ref<HTMLElement | null>(null)

import commenIcon from '../assets/commen.svg'
import thinkIcon from '../assets/think.svg'

const currentIcon = computed(() => {
  if (showPanel.value) {
    return thinkIcon
  }
  return commenIcon
})

const suggestions = [
  '了解锚定效应',
  '什么是认知失调',
  '弗洛伊德的潜意识理论',
  '存在主义哲学',
  '荣格的集体潜意识',
  '行为主义心理学'
]

const clearHideTimer = () => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
    hideTimer.value = null
  }
}

const handlePanelLeave = () => {
  hideTimer.value = setTimeout(() => {
    showPanel.value = false
  }, 300)
}

const goToChat = (question: string) => {
  showPanel.value = false
  router.push({
    path: '/ai-chat',
    query: question ? { q: question } : {}
  })
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    goToChat(searchQuery.value)
  }
}
</script>

<style scoped>
.ai-assistant-wrapper {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  pointer-events: none;
}

.ai-assistant-wrapper > * {
  pointer-events: auto;
}

.ai-assistant-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2d2d2d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
  transition: all 0.2s ease;
  border: 2px solid #2d2d2d;
}

.ai-assistant-icon:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
}

.icon-inner {
  width: 28px;
  height: 28px;
}

.icon-inner img {
  width: 100%;
  height: 100%;
}

.ai-search-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  background: white;
  border: 2px solid #2d2d2d;
  border-radius: 8px;
  box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
  padding: 16px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.suggestions {
  margin-bottom: 12px;
}

.suggestions-title {
  font-size: 13px;
  font-weight: 700;
  color: #2d2d2d;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-tag {
  padding: 6px 14px;
  background: #f5f0e8;
  border: 1px solid #2d2d2d;
  border-radius: 4px;
  font-size: 13px;
  color: #2d2d2d;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
}

.suggestion-tag:hover {
  background: #2d2d2d;
  color: white;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f0e8;
  border: 2px solid #2d2d2d;
  border-radius: 4px;
  padding: 10px 14px;
}

.search-box:focus-within {
  background: white;
  box-shadow: 3px 3px 0px 0px rgba(0,0,0,1);
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: #2d2d2d;
}

.search-box input::placeholder {
  color: #999;
}

.search-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #2d2d2d;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.15s ease;
}

.search-btn:hover {
  background: #e74c3c;
}

.search-btn svg {
  width: 16px;
  height: 16px;
}
</style>
