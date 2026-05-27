<template>
  <div class="hide-deco">
    <!-- 顶部导航栏 -->
    <header class="bg-white/90 backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <!-- 左侧导航 -->
          <div class="flex gap-8 text-base font-medium text-black">
            <router-link 
              :to="`/self-test/intro/${route.params.id}`"
              class="pb-1 border-b-2 border-transparent hover:border-primary transition-colors"
            >
              量表介绍
            </router-link>
            <button 
              @click="goToTest"
              class="pb-1 border-b-2 border-transparent hover:border-primary transition-colors"
            >
              开始测试
            </button>
          </div>
          
          <!-- 右侧返回 -->
          <router-link 
            :to="`/self-test/intro/${route.params.id}`"
            class="text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            返回
          </router-link>
        </div>
      </div>
    </header>

    <!-- 报告内容 -->
    <div class="bg-gray-50 min-h-screen py-8">
      <div class="max-w-4xl mx-auto px-4">
        <!-- 标题 -->
        <h1 class="text-3xl font-bold text-gray-800 mb-8">
          {{ scale?.title || '研究报告' }}
        </h1>

        <!-- 加载状态 -->
        <div v-if="loading" class="bg-white rounded-lg shadow-md p-8 text-center">
          <p class="text-gray-500">正在加载研究报告...</p>
        </div>

        <!-- 内容区域 -->
        <div v-else-if="reportContent" class="bg-white rounded-lg shadow-md p-8">
          <MarkdownRenderer :content="reportContent" />
        </div>

        <!-- 无报告 -->
        <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
          <p class="text-gray-500">暂无研究报告</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { scalesApi, type Scale } from '@/api/scalesApi'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

const route = useRoute()
const router = useRouter()
const scale = ref<Scale | null>(null)
const reportContent = ref('')
const loading = ref(true)

onMounted(async () => {
  document.title = '研究报告 - 每日心理学'
  loading.value = true
  const scaleId = Number(route.params.id)
  const scaleData = await scalesApi.getScaleById(scaleId)
  
  if (scaleData) {
    scale.value = scaleData
    reportContent.value = scaleData.report || ''
  }
  
  loading.value = false
})

const goToTest = () => {
  // 直接跳转到测试页面
  router.push(`/self-test/test/${route.params.id}`)
}
</script>
