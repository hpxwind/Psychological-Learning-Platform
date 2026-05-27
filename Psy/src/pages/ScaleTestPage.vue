<template>
  <div class="page-container">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <button 
          @click="goToIntro"
          class="nav-btn"
          :class="{ 'nav-btn-active': currentTab === 'intro' }"
        >
          量表介绍
        </button>
        <button 
          @click="goToTest"
          class="nav-btn"
          :class="{ 'nav-btn-active': currentTab === 'test' }"
        >
          开始测试
        </button>
      </div>
      <button 
        @click="goToIntro"
        class="nav-back"
      >
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        返回
      </button>
    </header>

    <div class="main-layout">
      <!-- 左侧信息卡片 (25%) -->
      <aside class="sidebar">
        <div class="sidebar-card">
          <!-- 量表标题 -->
          <h1 class="scale-title">{{ scale?.title || '加载中...' }}</h1>
          <p class="scale-subtitle">{{ scale?.tags?.join(' / ') || '' }}</p>
          
          <!-- 题目信息 -->
          <div class="scale-info">
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span>共{{ scale?.question_count || 0 }}题</span>
            </div>
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span>预计{{ Math.ceil((scale?.question_count || 60) / 5) }}分钟</span>
            </div>
          </div>
          
          <!-- 说明文字 -->
          <p class="scale-description">
            请根据您的实际情况，选择最符合的选项。答案没有对错之分，请按照第一印象进行回答。
          </p>
          
          <!-- 反馈邮箱 -->
          <div class="feedback-section">
            <span class="feedback-label">问题反馈</span>
            <a href="mailto:feedback@example.com" class="feedback-email">feedback@example.com</a>
          </div>
          
          <!-- 按钮 -->
          <button class="btn-report" @click="goToReport">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            阅读此量表的研究报告
          </button>
        </div>
      </aside>

      <!-- 右侧答题区域 (75%) -->
      <main class="main-content">
        <!-- 题目卡片 -->
        <div v-if="currentQuestionData" class="question-card">
          <!-- 进度条 -->
          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
            </div>
            <span class="progress-text">{{ currentQuestion + 1 }} / {{ scale?.questions?.length || 0 }}</span>
          </div>

          <!-- 测试说明 -->
          <div class="test-instructions">
            <p>请根据您的实际情况，选择最符合的选项。</p>
          </div>

          <!-- 题干 -->
          <div class="question-header">
            <span class="question-number">{{ currentQuestion + 1 }}</span>
            <span class="question-title">{{ currentQuestionData.title }}</span>
          </div>

          <!-- 选项 -->
          <div class="options-container">
            <label 
              v-for="(option, index) in currentQuestionData.options" 
              :key="index"
              class="option-item"
              :class="{ 'option-selected': answers[currentQuestionData.id] === option.value }"
            >
              <input 
                type="radio" 
                :name="`question-${currentQuestion}`"
                :value="option.value"
                v-model="answers[currentQuestionData.id]"
                class="option-radio"
                @change="selectAnswer(option.value)"
              />
              <span class="option-indicator"></span>
              <span class="option-label">{{ option.label }}</span>
            </label>
          </div>

          <!-- 底部导航 -->
          <div class="question-footer">
            <button 
              @click="prevQuestion"
              :disabled="currentQuestion === 0"
              class="btn-nav"
              :class="{ 'btn-nav-disabled': currentQuestion === 0 }"
            >
              上一题
            </button>
            
            <div class="nav-hint">
              <!-- 显示答题进度 -->
              <span class="answer-progress">
                已答: <strong>{{ answeredCount }}</strong> / {{ scale?.questions?.length || 0 }}
              </span>
              <span v-if="!answers[currentQuestionData.id]" class="hint-warning">请选择选项</span>
              <span v-else class="hint-success">已选择</span>
            </div>
            
            <button 
              v-if="currentQuestion < (scale?.questions?.length || 0) - 1"
              @click="nextQuestion"
              :disabled="!answers[currentQuestionData.id]"
              class="btn-nav btn-nav-next"
              :class="{ 'btn-nav-disabled': !answers[currentQuestionData.id] }"
            >
              下一题
            </button>
            
            <button 
              v-else
              @click="submitTest"
              class="btn-nav btn-nav-submit"
              :class="{ 'btn-nav-disabled': !isAllAnswered }"
            >
              {{ isAllAnswered ? '提交测试' : `还差${scale?.questions?.length - answeredCount}题` }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scalesApi, type Scale, type Question } from '@/api/scalesApi'

const route = useRoute()
const router = useRouter()

const scale = ref<Scale | null>(null)
const currentQuestion = ref(0)
const answers = ref<Record<string, number | string>>({})
const currentTab = ref('test')

const currentQuestionData = computed(() => {
  return scale.value?.questions?.[currentQuestion.value] || null
})

const progressPercentage = computed(() => {
  if (!scale.value?.questions.length) return 0
  return Math.round(((currentQuestion.value + 1) / scale.value.questions.length) * 100)
})

const isAllAnswered = computed(() => {
  if (!scale.value) return false
  return scale.value.questions.every((q: Question) => answers.value[q.id] !== undefined)
})

// 已答题数量
const answeredCount = computed(() => {
  return Object.keys(answers.value).length
})

const selectAnswer = (value: number | string) => {
  if (currentQuestionData.value) {
    answers.value[currentQuestionData.value.id] = value
    // 自动跳转到下一题
    if (currentQuestion.value < (scale.value?.questions.length || 0) - 1) {
      setTimeout(() => {
        nextQuestion()
      }, 200)
    }
  }
}

const prevQuestion = () => {
  if (currentQuestion.value > 0) {
    currentQuestion.value--
  }
}

const nextQuestion = () => {
  if (currentQuestion.value < (scale.value?.questions.length || 0) - 1) {
    currentQuestion.value++
  }
}

const goToIntro = () => {
  // 检查是否有未答完的题目
  const answeredCount = Object.keys(answers.value).length
  const totalCount = scale.value?.questions?.length || 0
  
  if (answeredCount < totalCount && answeredCount > 0) {
    ElMessageBox.confirm(
      `您还有 ${totalCount - answeredCount} 题未作答，确定要退出吗？退出后您的作答进度将不会保存。`,
      '提示',
      {
        confirmButtonText: '确定退出',
        cancelButtonText: '继续答题',
        type: 'warning'
      }
    ).then(() => {
      router.push(`/self-test/intro/${route.params.id}`)
    }).catch(() => {
      // 用户取消，什么都不做
    })
  } else {
    router.push(`/self-test/intro/${route.params.id}`)
  }
}

const goToTest = () => {
  // 已经在测试页面，无需跳转
}

const goToReport = () => {
  router.push(`/self-test/report/${route.params.id}`)
}

const submitTest = () => {
  if (!isAllAnswered.value) {
    ElMessage.warning('请完成所有题目后再提交')
    return
  }
  ElMessage.success('测试提交成功！')
  
  // 跳转到结果页面，携带测试数据
  router.push({
    name: 'test-result',
    state: {
      testResult: {
        scaleId: scale.value?.id,
        scaleTitle: scale.value?.title,
        questions: scale.value?.questions,
        answers: answers.value,
        timestamp: new Date().toISOString()
      }
    }
  })
}

onMounted(async () => {
  document.title = '答题测试 - 每日心理学'
  
  try {
    const scaleId = Number(route.params.id)
    const scaleData = await scalesApi.getScaleById(scaleId)
    if (scaleData) {
      // getScaleById 已经返回完整的 questions 和 report
      scale.value = scaleData
    }
  } catch (error) {
    console.error('加载量表数据失败', error)
    ElMessage.error('加载量表数据失败，请返回重试')
  }
  
  // 添加页面离开提示
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 页面刷新或关闭时的提示
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  const answeredCount = Object.keys(answers.value).length
  const totalCount = scale.value?.questions?.length || 0
  
  if (answeredCount < totalCount && answeredCount > 0) {
    e.preventDefault()
    e.returnValue = ''
    return ''
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f0f2f5;
}

/* 顶部导航栏 */
.top-nav {
  background: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  gap: 8px;
}

.nav-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f3f4f6;
}

.nav-btn-active {
  background: #667eea;
  color: white;
}

.nav-btn-active:hover {
  background: #5a6fd6;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-back:hover {
  background: #f3f4f6;
  color: #333;
}

.back-icon {
  width: 18px;
  height: 18px;
}

/* 主布局 */
.main-layout {
  display: flex;
  padding: 24px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 左侧边栏 (25%) */
.sidebar {
  width: 25%;
  flex-shrink: 0;
}

.sidebar-card {
  background: white;
  border-radius: 4px;
  padding: 28px;
  color: #333;
  position: sticky;
  top: 84px;
  border: 1px solid #e5e7eb;
}

.scale-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  line-height: 1.3;
  color: #1f2937;
}

.scale-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 20px;
}

.scale-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #4b5563;
}

.info-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.scale-description {
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
  margin-bottom: 20px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 4px;
}

.feedback-section {
  margin-bottom: 16px;
}

.feedback-label {
  font-size: 11px;
  color: #9ca3af;
  display: block;
  margin-bottom: 4px;
}

.feedback-email {
  color: #667eea;
  font-size: 12px;
  text-decoration: none;
}

.feedback-email:hover {
  text-decoration: underline;
}

.btn-report {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 10px;
  background: white;
  color: #4b5563;
}

.btn-report:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* 右侧主内容 (75%) */
.main-content {
  flex: 1;
}

.question-card {
  background: white;
  border-radius: 4px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
  min-width: 50px;
}

.test-instructions {
  background: #f9fafb;
  padding: 14px 18px;
  border-radius: 4px;
  margin-bottom: 24px;
  border-left: 3px solid #667eea;
}

.test-instructions p {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
}

.question-number {
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.question-title {
  font-size: 17px;
  color: #1f2937;
  font-weight: 500;
  line-height: 1.6;
  padding-top: 4px;
}

/* 选项 */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.option-item:hover {
  border-color: #667eea;
}

.option-selected {
  background: #eef2ff;
  border-color: #667eea;
}

.option-radio {
  display: none;
}

.option-indicator {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s;
}

.option-selected .option-indicator {
  border-color: #667eea;
  background: #667eea;
}

.option-selected .option-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  background: white;
  border-radius: 50%;
}

.option-label {
  font-size: 14px;
  color: #4b5563;
  flex: 1;
}

.option-selected .option-label {
  color: #667eea;
  font-weight: 500;
}

/* 底部导航 */
.question-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
}

.btn-nav {
  padding: 10px 22px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #f3f4f6;
  color: #6b7280;
}

.btn-nav:hover:not(.btn-nav-disabled) {
  background: #e5e7eb;
}

.btn-nav-next,
.btn-nav-submit {
  background: #667eea;
  color: white;
}

.btn-nav-next:hover:not(.btn-nav-disabled),
.btn-nav-submit:hover:not(.btn-nav-disabled) {
  background: #5a6fd6;
}

.btn-nav-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-hint {
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.answer-progress {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

.answer-progress strong {
  color: #1f2937;
}

.hint-warning {
  color: #f59e0b;
}

.hint-success {
  color: #10b981;
}
</style>
