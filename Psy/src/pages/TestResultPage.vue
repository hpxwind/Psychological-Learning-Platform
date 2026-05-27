<template>
  <div class="result-page">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <button @click="goToList" class="nav-btn">
          返回列表
        </button>
      </div>
      <div class="nav-title">{{ scaleTitle }}</div>
      <div class="nav-actions">
        <button @click="saveAsPdf" class="nav-btn-secondary" :disabled="savingPdf">
          <svg v-if="!savingPdf" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="12" y2="12"/>
            <line x1="15" y1="15" x2="12" y2="12"/>
          </svg>
          {{ savingPdf ? '保存中...' : '保存PDF' }}
        </button>
        <button @click="downloadMd" class="nav-btn-secondary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下载报告
        </button>
      </div>
    </header>

    <!-- 主内容 -->
    <div class="main-layout">
      <div class="result-card">
        <!-- 测试信息 -->
        <div class="test-info">
          <h1 class="result-title">{{ scaleTitle }}</h1>
          <p class="result-subtitle">测评完成时间: {{ formatDate(timestamp) }}</p>
        </div>

        <!-- AI分析报告 -->
        <div class="report-section">
          <div class="section-header">
            <h2>AI 智能分析报告</h2>
            <span class="ai-badge">
              <svg class="ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              由 AI 生成
            </span>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在生成分析报告...</p>
          </div>

          <!-- 报告内容 -->
          <div v-else-if="aiReport" class="report-content" v-html="formattedReport"></div>

          <!-- 无报告 -->
          <div v-else class="no-report">
            <p>暂时无法生成分析报告</p>
            <button @click="regenerateReport" class="btn-retry">
              重新生成
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <button @click="goToList" class="btn-primary">
            返回量表列表
          </button>
          <button @click="retest" class="btn-secondary">
            重新测试
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { scalesApi, type Question, type TestResult } from '@/api/scalesApi'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const scaleTitle = ref('心理测评')
const scaleId = ref(1)
const questions = ref<Question[]>([])
const answers = ref<Record<string, number>>({})
const aiReport = ref('')
const loading = ref(true)
const savingPdf = ref(false)
const timestamp = ref(new Date().toISOString())

// 格式化报告内容
const formattedReport = computed(() => {
  if (!aiReport.value) return ''
  
  return aiReport.value
    .replace(/^# (.+)$/gm, '<h2 class="report-h2">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 class="report-h3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p class="report-p">')
    .replace(/\n/g, '<br>')
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生成分析报告
const generateReport = async () => {
  loading.value = true
  try {
    const result = await scalesApi.analyzeScaleResult(
      scaleTitle.value,
      scaleId.value,
      questions.value,
      answers.value
    )
    
    if (result.success && result.report) {
      aiReport.value = result.report
      
      // 保存结果
      const testResult: TestResult = {
        scaleId: scaleId.value,
        scaleTitle: scaleTitle.value,
        answers: answers.value,
        totalScore: 0,
        avgScore: 0,
        report: result.report,
        timestamp: timestamp.value
      }
      scalesApi.saveTestResult(testResult)
      
      // 报告生成成功后自动打印（延迟500ms确保内容渲染完成）
      setTimeout(() => {
        autoPrint()
      }, 500)
    } else {
      aiReport.value = ''
    }
  } catch (error) {
    console.error('生成报告失败:', error)
    aiReport.value = ''
  } finally {
    loading.value = false
  }
}

// 自动打印
const autoPrint = () => {
  // 隐藏导航栏和操作按钮，只打印报告内容
  const topNav = document.querySelector('.top-nav') as HTMLElement
  const actionSection = document.querySelector('.action-section') as HTMLElement
  
  if (topNav) topNav.style.display = 'none'
  if (actionSection) actionSection.style.display = 'none'
  
  // 触发打印
  window.print()
  
  // 恢复显示
  setTimeout(() => {
    if (topNav) topNav.style.display = ''
    if (actionSection) actionSection.style.display = ''
  }, 100)
}

// 重新生成报告
const regenerateReport = () => {
  generateReport()
}

// 下载 Markdown 报告
const downloadMd = () => {
  const markdown = scalesApi.generateReportMarkdown(
    scaleTitle.value,
    scaleId.value,
    questions.value,
    answers.value,
    aiReport.value
  )
  
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${scaleTitle.value}_测评报告_${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('报告已下载')
}

// 保存为 PDF
const saveAsPdf = async () => {
  if (savingPdf.value) return
  savingPdf.value = true
  
  try {
    // 使用 window.print 触发浏览器打印对话框
    window.print()
    ElMessage.success('请在打印对话框中选择"保存为PDF"')
  } catch (error) {
    console.error('保存PDF失败:', error)
    ElMessage.error('保存PDF失败')
  } finally {
    savingPdf.value = false
  }
}

// 返回列表
const goToList = () => {
  router.push('/self-test')
}

// 重新测试
const retest = () => {
  router.push(`/self-test/test/${scaleId.value}`)
}

onMounted(async () => {
  document.title = '测试结果 - 每日心理学'
  // 从路由参数或 localStorage 获取测试结果
  const state = history.state
  
  if (state?.testResult) {
    scaleTitle.value = state.testResult.scaleTitle || '心理测评'
    scaleId.value = state.testResult.scaleId || 1
    questions.value = state.testResult.questions || []
    answers.value = state.testResult.answers || {}
    timestamp.value = state.testResult.timestamp || new Date().toISOString()
  } else {
    // 尝试从 URL 参数获取
    const scaleIdParam = route.query.scaleId
    const answersParam = route.query.answers
    
    try {
      if (scaleIdParam) {
        scaleId.value = Number(scaleIdParam)
        const scale = await scalesApi.getScaleById(scaleId.value)
        if (scale) {
          scaleTitle.value = scale.title
          questions.value = await scalesApi.getQuestions(scale.questions_path)
        }
      }
      
      if (answersParam) {
        try {
          answers.value = JSON.parse(decodeURIComponent(answersParam as string))
        } catch {
          answers.value = {}
        }
      }
    } catch (error) {
      console.error('加载测试数据失败', error)
      ElMessage.error('加载测试数据失败')
    }
  }
  
  // 生成 AI 报告
  try {
    await generateReport()
  } catch (error) {
    console.error('生成报告失败', error)
  }
})
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.main-layout {
  flex: 1;
  max-width: 900px;
  margin: 24px auto;
  padding: 0 24px;
}

/* 顶部导航 */
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

.nav-left, .nav-actions {
  display: flex;
  gap: 8px;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.nav-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f3f4f6;
  color: #333;
}

.nav-btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.nav-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.result-card {
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

/* 测试信息 */
.test-info {
  text-align: center;
  margin-bottom: 32px;
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.result-subtitle {
  font-size: 14px;
  color: #6b7280;
}

/* 报告区域 */
.report-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.ai-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #e0e7ff;
  color: #667eea;
  font-size: 12px;
  border-radius: 12px;
}

.ai-icon {
  width: 14px;
  height: 14px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  background: #f9fafb;
  border-radius: 8px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 14px;
  color: #6b7280;
}

/* 报告内容 */
.report-content {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.report-content :deep(.report-h2) {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.report-content :deep(.report-h3) {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 24px 0 12px 0;
}

.report-content :deep(.report-p) {
  margin: 0 0 12px 0;
}

/* 无报告 */
.no-report {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  background: #f9fafb;
  border-radius: 8px;
}

.no-report p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.btn-retry {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #5a6fd6;
}

/* 操作按钮 */
.action-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  padding: 12px 32px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #5a6fd6;
}

.btn-secondary {
  padding: 12px 32px;
  background: white;
  color: #666;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* 打印样式 */
@media print {
  .top-nav, .action-section, .nav-actions {
    display: none !important;
  }
  
  .result-page {
    background: white;
  }
  
  .main-layout {
    max-width: 100%;
    margin: 0;
    padding: 20mm;
  }
  
  .result-card {
    box-shadow: none;
    border: none;
  }
  
  .report-content {
    background: white !important;
    border-left: 4px solid #667eea !important;
    padding: 16px !important;
  }
  
  .test-info {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e5e7eb;
  }
}
</style>
