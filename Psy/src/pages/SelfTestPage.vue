<template>
  <!-- 隐藏全局装饰方块 -->
  <div class="hide-deco">
    <div class="min-h-screen bg-gray-50">
      <!-- 顶部导航栏 -->
      <header class="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 py-3">
          <div class="flex justify-between items-center">
            <!-- 左侧导航 -->
            <div class="flex gap-8 text-base font-medium text-black">
              <router-link 
                to="/self-test" 
                class="pb-1 border-b-2 border-transparent hover:border-primary transition-colors"
                :class="{ 'border-primary': activeTab === 'individual' }"
                @click="activeTab = 'individual'"
              >
                个体测试
              </router-link>
            </div>
            
            <!-- 右侧返回首页 -->
            <router-link 
              to="/" 
              class="text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              返回首页
            </router-link>
          </div>
        </div>
      </header>

      <!-- Hero 区域 - 全宽风景图 -->
      <div class="relative w-full h-[35vh] min-h-[300px] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80" 
          alt="自然风景" 
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/40 flex flex-col justify-center px-8 md:px-16">
          <h1 class="text-4xl md:text-5xl font-bold text-white tracking-wider">
            {{ activeTab === 'individual' ? '个体测试' : '' }}
          </h1>
          <p class="text-sm text-gray-200 mt-2">专业的心理测评，助您更好地认识自己</p>
        </div>
      </div>

    <!-- 搜索和筛选区域 -->
    <div class="bg-white border-b-2 border-gray-200 py-4">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <!-- 搜索框 -->
          <div class="relative flex-1">
            <input 
              v-model="searchKeyword" 
              type="text" 
              placeholder="搜索测试量表..."
              class="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          
          <!-- 分类下拉框 -->
          <select 
            v-model="selectedCategory" 
            class="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none bg-white min-w-[150px]"
          >
            <option value="">全部分类</option>
            <option value="personality">人格测试</option>
            <option value="emotion">情绪测试</option>
            <option value="social">社交测试</option>
            <option value="career">职业测试</option>
            <option value="mental">心理健康</option>
          </select>
        </div>
      </div>
    </div>

<!-- 测试量表列表 -->
      <div class="max-w-7xl mx-auto px-4 py-8">
      
      <div v-if="filteredScales.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="scale in filteredScales" 
          :key="scale.id"
          class="bg-white rounded-4 shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100"
        >
          <!-- 量表图片 -->
          <div class="h-40 overflow-hidden">
            <img :src="scale.cover_image" :alt="scale.title" class="w-full h-full object-cover" />
          </div>
          
          <!-- 量表信息 -->
          <div class="p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                {{ getCategoryName(scale.category) }}
              </span>
              <span class="text-gray-400 text-xs">{{ scale.question_count }}题</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ scale.title }}</h3>
            <p class="text-gray-500 text-sm line-clamp-2 mb-2">{{ scale.brief }}</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="tag in scale.tags" :key="tag" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {{ tag }}
              </span>
            </div>
            
            <!-- 按钮 -->
            <button @click="goToIntro(scale)" class="mt-4 w-full py-2 bg-primary text-white rounded-4 font-medium hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
              开始测试
            </button>
          </div>
        </div>
      </div>
      
      <!-- 无结果 -->
      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-gray-500">暂无相关测试量表</p>
      </div>
    </div>

    <!-- 测试弹窗 -->
    <el-dialog 
      v-model="testDialogVisible" 
      :title="currentScale?.title" 
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentScale" class="test-content">
        <p class="text-gray-600 mb-4">{{ currentScale.description }}</p>
        
        <!-- 测试进度 -->
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-500 mb-1">
            <span>进度</span>
            <span>{{ currentQuestion + 1 }} / {{ currentScale.questions.length }}</span>
          </div>
          <el-progress :percentage="progressPercentage" :show-text="false" />
        </div>
        
        <!-- 当前题目 -->
        <div v-if="currentScale.questions[currentQuestion]" class="question-box p-4 bg-gray-50 rounded-lg mb-4">
          <p class="font-medium text-gray-800 mb-3">{{ currentScale.questions[currentQuestion].title }}</p>
          
          <div class="space-y-2">
            <label 
              v-for="(option, idx) in currentScale.questions[currentQuestion].options" 
              :key="idx"
              class="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors"
              :class="{ 'border-primary bg-primary/5': answers[currentScale.questions[currentQuestion].id] === option.value }"
            >
              <input 
                type="radio" 
                :name="'question-' + currentScale.questions[currentQuestion].id"
                :value="option.value"
                v-model="answers[currentScale.questions[currentQuestion].id]"
                class="w-4 h-4 text-primary"
              />
              <span class="text-gray-700">{{ option.label }}</span>
            </label>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex justify-between">
          <el-button 
            v-if="currentQuestion > 0" 
            @click="prevQuestion"
          >
            上一题
          </el-button>
          <div class="flex-1"></div>
          <el-button 
            v-if="currentQuestion < currentScale.questions.length - 1" 
            type="primary" 
            @click="nextQuestion"
            :disabled="!answers[currentScale.questions[currentQuestion].id]"
          >
            下一题
          </el-button>
          <el-button 
            v-else 
            type="success" 
            @click="submitTest"
            :disabled="!isAllAnswered"
          >
            提交测试
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 结果弹窗 -->
    <el-dialog v-model="resultDialogVisible" title="测试结果" width="500px">
      <div v-if="testResult" class="text-center">
        <div class="text-6xl font-bold text-primary mb-4">{{ testResult.score }}</div>
        <p class="text-xl text-gray-700 mb-2">{{ testResult.level }}</p>
        <p class="text-gray-500 mb-6">{{ testResult.description }}</p>
        
        <div class="bg-gray-50 rounded-lg p-4 text-left">
          <h4 class="font-medium text-gray-700 mb-2">建议：</h4>
          <p class="text-gray-600 text-sm">{{ testResult.suggestion }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="resultDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="retest">重新测试</el-button>
      </template>
    </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { scalesApi, type Scale } from '@/api/scalesApi';

const route = useRoute();
const activeTab = ref(route.path.includes('group') ? 'group' : 'individual');
const searchKeyword = ref('');
const selectedCategory = ref('');
const testDialogVisible = ref(false);
const resultDialogVisible = ref(false);
const currentScale = ref<any>(null);
const currentQuestion = ref(0);
const answers = ref<Record<string, number>>({});
const testResult = ref<any>(null);

// 从数据库加载量表数据
const scales = ref<Scale[]>([]);

const filteredScales = computed(() => {
  return scales.value.filter(scale => {
    const matchKeyword = searchKeyword.value === '' || 
      scale.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      scale.brief.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      scale.tags.some(tag => tag.toLowerCase().includes(searchKeyword.value.toLowerCase()));
    const matchCategory = selectedCategory.value === '' || scale.category === selectedCategory.value;
    return matchKeyword && matchCategory;
  });
});

const progressPercentage = computed(() => {
  if (!currentScale.value) return 0;
  return Math.round((currentQuestion.value / (currentScale.value.questions.length - 1)) * 100);
});

const isAllAnswered = computed(() => {
  if (!currentScale.value) return false;
  return currentScale.value.questions.every((q: any) => answers.value[q.id] !== undefined);
});

const getCategoryName = (category: string) => {
  const map: Record<string, string> = {
    personality: '人格测试',
    emotion: '情绪测试',
    social: '社交测试',
    career: '职业测试',
    mental: '心理健康',
    mental_health: '心理健康'
  };
  return map[category] || category;
};

// 格式化简介文本，去除空行但保留换行
const formatBrief = (text: string) => {
  if (!text) return '';
  return text.replace(/\n\s*\n/g, '\n').trim();
};

const startTest = async (scale: Scale) => {
  // 通过API获取完整问卷数据（包括题目）
  const fullScale = await scalesApi.getScaleById(scale.id);
  if (fullScale) {
    currentScale.value = fullScale;
    currentQuestion.value = 0;
    answers.value = {};
    testDialogVisible.value = true;
  }
};

const goToIntro = (scale: Scale) => {
  // 在新标签页打开量表介绍页面
  window.open(`/self-test/intro/${scale.id}`, '_blank');
};

const prevQuestion = () => {
  if (currentQuestion.value > 0) {
    currentQuestion.value--;
  }
};

const nextQuestion = () => {
  if (currentQuestion.value < currentScale.value.questions.length - 1) {
    currentQuestion.value++;
  }
};

const submitTest = () => {
  // 计算结果
  const totalScore = Object.values(answers.value).reduce((sum, val) => sum + val, 0);
  const avgScore = totalScore / Object.keys(answers.value).length;
  
  testResult.value = {
    score: Math.round(avgScore * 20),
    level: avgScore <= 2 ? '正常' : avgScore <= 3 ? '轻度异常' : '需要关注',
    description: '您的测试结果显示心理状态处于良好水平',
    suggestion: '保持良好的生活习惯，适当运动，保持积极乐观的心态'
  };
  
  testDialogVisible.value = false;
  resultDialogVisible.value = true;
};

const retest = () => {
  resultDialogVisible.value = false;
  testDialogVisible.value = true;
  currentQuestion.value = 0;
  answers.value = {};
};

// 加载量表数据
const loadScales = async () => {
  const data = await scalesApi.getScales();
  scales.value = data;
};

// 检查是否有从介绍页面跳转过来的待测试量表
onMounted(async () => {
  document.title = '心理测评 - 每日心理学'
  // 加载量表列表，使用try-catch确保不会因为请求失败导致页面崩溃
  try {
    await loadScales();
  } catch (error) {
    console.error('加载量表列表失败', error);
  }
  
  const pendingScale = localStorage.getItem('pendingScale');
  if (pendingScale) {
    localStorage.removeItem('pendingScale');
    try {
      const scaleData = JSON.parse(pendingScale);
      // 查找完整数据
      const fullScale = scales.value.find((s: any) => s.id === scaleData.id);
      if (fullScale) {
        startTest(fullScale);
      }
    } catch (error) {
      console.error('解析待测试量表数据失败', error);
    }
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 覆盖 Layout 的装饰性方块 */
:deep(.deco-squares) {
  display: none !important;
}

:deep(.deco-square) {
  display: none !important;
}

/* 隐藏装饰方块 */
.hide-deco {
  position: relative;
}

.hide-deco::before,
.hide-deco::after {
  display: none !important;
  content: none !important;
}

:deep(.deco-squares),
:deep(.deco-square) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
</style>
