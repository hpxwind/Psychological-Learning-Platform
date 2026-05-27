<template>
  <div class="hide-deco">
    <!-- 顶部导航栏 -->
    <header class="bg-white/90 backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <!-- 左侧返回 -->
          <div class="flex gap-8 text-base font-medium text-black">
            <router-link 
              to="/self-test" 
              class="pb-1 border-b-2 border-transparent hover:border-primary transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              返回量表列表
            </router-link>
          </div>
          
          <!-- 右侧返回首页 -->
          <router-link 
            to="/" 
            class="text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            返回首页
          </router-link>
        </div>
      </div>
    </header>

    <!-- 背景图片 -->
    <div class="relative min-h-[calc(100vh-60px)]">
      <img 
        v-if="scale"
        :src="scale.cover_image" 
        :alt="scale.title" 
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-black/50"></div>
      
      <!-- 内容区域 -->
      <div class="relative z-10 flex items-center min-h-[calc(100vh-60px)] px-8 md:px-16">
        <div v-if="scale" class="max-w-2xl text-left">
          <!-- 标题 -->
          <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
            {{ scale.title }}
          </h1>
          
          <!-- 标签组 -->
          <div class="flex flex-wrap gap-3 mb-6">
            <span class="inline-block px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
              {{ getCategoryName(scale.category) }}
            </span>
            <span class="inline-block px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full backdrop-blur-sm">
              {{ scale.question_count }} 题
            </span>
          </div>
          
          <!-- 描述 -->
          <p class="text-gray-100 text-lg leading-relaxed mb-8 whitespace-pre-wrap">
            {{ formatBrief(scale.brief) }}
          </p>
          
          <!-- 按钮组 -->
          <div class="flex flex-wrap gap-4 mb-4">
            <!-- 开始测试按钮 -->
            <button 
              @click="beginTest"
              class="px-8 py-3 bg-blue-400 text-white text-lg font-semibold rounded-[6px] hover:bg-blue-500 transition-all duration-200"
            >
              开始测试 →
            </button>
            
            <!-- 研究报告按钮 -->
            <button 
              @click="goToReport"
              class="group flex items-center gap-3 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-[6px] hover:bg-white/20 transition-all duration-200"
            >
              <!-- 图标 -->
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div class="text-left">
                <div class="font-semibold">研究报告</div>
                <div class="text-xs text-gray-300">由 Gemini AI DeepResearch 生成</div>
              </div>
            </button>
          </div>
          
          <p class="text-gray-300 text-sm">
            完成测试后，您将获得详细的心理分析报告
          </p>
        </div>
        
        <!-- 加载状态 -->
        <div v-else class="text-white text-center">
          <p class="text-xl">加载中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { scalesApi, type Scale } from '@/api/scalesApi'

const route = useRoute()
const router = useRouter()
const scale = ref<Scale | null>(null)

const categoryNames: Record<string, string> = {
  personality: '人格特质',
  emotion: '情绪情感',
  relationship: '人际关系',
  career: '职业发展',
  mental_health: '心理健康',
  cognitive: '认知能力',
  other: '其他'
}

// 格式化简介文本，去除空行但保留换行，每段开头空两格
const formatBrief = (text: string) => {
  if (!text) return '';
  const cleaned = text.replace(/\n\s*\n/g, '\n').trim();
  // 每段开头添加8个空格（相当于2个汉字宽度）
  return cleaned.split('\n').map(line => '        ' + line).join('\n');
};

const getCategoryName = (category: string) => {
  return categoryNames[category] || category
}

onMounted(async () => {
  document.title = '量表介绍 - 每日心理学'
  const scaleId = Number(route.params.id)
  scale.value = await scalesApi.getScaleById(scaleId)
})

const beginTest = () => {
  // 跳转到测试页面
  router.push(`/self-test/test/${route.params.id}`)
}

const goToReport = () => {
  // 在新标签页打开研究报告页面
  window.open(`/self-test/report/${route.params.id}`, '_blank')
}
</script>

<style scoped>
</style>
