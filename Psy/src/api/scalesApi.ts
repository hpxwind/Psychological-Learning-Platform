import { ElMessage } from 'element-plus'
import api from '@/lib/axios'

export interface Scale {
  id: number
  title: string
  brief: string
  tags: string[]
  category: string
  cover_image: string
  question_count: number
  report_path: string
  questions_path: string
  // 详情接口返回的字段
  questions?: Question[]
  report?: string
}

export interface QuestionOption {
  label: string
  value: number | string
}

export interface Question {
  id: string
  title: string
  options: QuestionOption[]
}

export interface TestResult {
  scaleId: number
  scaleTitle: string
  answers: Record<string, number | string>
  totalScore: number
  avgScore: number
  report?: string
  timestamp: string
  // MBTI 专用字段
  mbtiType?: string
  mbtiScores?: Record<string, number>
}

export const scalesApi = {
  /**
   * 获取所有量表列表（通过后端API）
   */
  async getScales(): Promise<Scale[]> {
    try {
      const res = await api.get('/scales')
      if (res.data.success) {
        return res.data.scales || []
      }
      return []
    } catch (error) {
      console.error('获取量表列表失败:', error)
      ElMessage.error('获取量表列表失败')
      return []
    }
  },

  /**
   * 根据ID获取单个量表详情
   */
  async getScaleById(id: number | string): Promise<Scale | null> {
    try {
      const res = await api.get(`/scales/${id}`)
      if (res.data.success) {
        return res.data.scale
      }
      return null
    } catch (error) {
      console.error('获取量表详情失败:', error)
      ElMessage.error('获取量表详情失败')
      return null
    }
  },

  /**
   * 根据分类获取量表
   */
  async getScalesByCategory(category: string): Promise<Scale[]> {
    try {
      const scales = await this.getScales()
      if (!category) return scales
      return scales.filter(s => s.category === category)
    } catch (error) {
      console.error('获取量表列表失败:', error)
      return []
    }
  },

  /**
   * 搜索量表
   */
  async searchScales(keyword: string): Promise<Scale[]> {
    try {
      const scales = await this.getScales()
      const lowerKeyword = keyword.toLowerCase()
      return scales.filter(s => 
        s.title.toLowerCase().includes(lowerKeyword) ||
        s.brief.toLowerCase().includes(lowerKeyword) ||
        s.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
      )
    } catch (error) {
      console.error('搜索量表失败:', error)
      return []
    }
  },

  /**
   * 获取量表题目
   */
  async getQuestions(questionsPath: string): Promise<Question[]> {
    try {
      // 通过后端API获取题目，避免跨域问题
      const res = await api.get(`/scales/questions?path=${encodeURIComponent(questionsPath)}`)
      if (res.data.success) {
        return res.data.questions || []
      }
      return []
    } catch (error) {
      console.error('获取题目失败:', error)
      ElMessage.error('获取题目失败')
      return []
    }
  },

  /**
   * 获取量表研究报告
   */
  async getReport(reportPath: string): Promise<string> {
    try {
      // 通过后端API获取报告，避免跨域问题
      const res = await api.get(`/scales/report?path=${encodeURIComponent(reportPath)}`)
      if (res.data.success) {
        return res.data.report || ''
      }
      return '研究报告加载失败'
    } catch (error) {
      console.error('获取研究报告失败:', error)
      return '研究报告加载失败'
    }
  },

  /**
   * 发送量表结果给AI分析
   */
  async analyzeScaleResult(
    scaleTitle: string,
    scaleId: number,
    questions: Question[],
    answers: Record<string, number | string>
  ): Promise<{ success: boolean; report?: string; error?: string }> {
    try {
      const response = await fetch('/api/scale/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scaleTitle,
          scaleId,
          questions,
          answers
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        return { success: true, report: data.report }
      } else {
        ElMessage.error(data.error || '分析失败')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('AI分析请求失败:', error)
      ElMessage.error('网络请求失败，请检查服务器连接')
      return { success: false, error: '网络请求失败' }
    }
  },

  /**
   * 保存测试结果到本地存储
   */
  saveTestResult(result: TestResult): void {
    const results = this.getTestResults()
    results.push(result)
    localStorage.setItem('test_results', JSON.stringify(results))
  },

  /**
   * 获取所有测试结果
   */
  getTestResults(): TestResult[] {
    const saved = localStorage.getItem('test_results')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  },

  /**
   * 生成测试报告Markdown
   */
  generateReportMarkdown(
    scaleTitle: string,
    scaleId: number,
    questions: Question[],
    answers: Record<string, number | string>,
    aiReport?: string
  ): string {
    // 检查是否是MBTI量表
    const isMBTI = scaleTitle.includes('MBTI')
    
    let markdown = `# ${scaleTitle} 测评报告\n\n`
    markdown += `> 生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`
    
    if (isMBTI) {
      // MBTI 计分逻辑
      const mbtiScores: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
      let mbtiType = ''
      
      questions.forEach((q) => {
        const answer = answers[q.id]
        const selectedOption = q.options.find(o => o.value === answer)
        if (selectedOption && typeof selectedOption.value === 'string') {
          const dimension = selectedOption.value as keyof typeof mbtiScores
          if (mbtiScores[dimension] !== undefined) {
            mbtiScores[dimension]++
          }
        }
      })
      
      // 确定MBTI类型
      mbtiType += mbtiScores.E >= mbtiScores.I ? 'E' : 'I'
      mbtiType += mbtiScores.S >= mbtiScores.N ? 'S' : 'N'
      mbtiType += mbtiScores.T >= mbtiScores.F ? 'T' : 'F'
      mbtiType += mbtiScores.J >= mbtiScores.P ? 'J' : 'P'
      
      markdown += `## 您的MBTI性格类型\n\n`
      markdown += `### ${mbtiType}\n\n`
      markdown += `| 维度 | 第一倾向 | 得分 | 第二倾向 | 得分 |\n`
      markdown += `|------|---------|------|---------|------|\n`
      markdown += `| 能量倾向 | ${mbtiScores.E >= mbtiScores.I ? '外向(E)' : '内向(I)'} | ${mbtiScores.E >= mbtiScores.I ? mbtiScores.E : mbtiScores.I} | ${mbtiScores.E >= mbtiScores.I ? '内向(I)' : '外向(E)'} | ${mbtiScores.E >= mbtiScores.I ? mbtiScores.I : mbtiScores.E} |\n`
      markdown += `| 感知方式 | ${mbtiScores.S >= mbtiScores.N ? '感觉(S)' : '直觉(N)'} | ${mbtiScores.S >= mbtiScores.N ? mbtiScores.S : mbtiScores.N} | ${mbtiScores.S >= mbtiScores.N ? '直觉(N)' : '感觉(S)'} | ${mbtiScores.S >= mbtiScores.N ? mbtiScores.N : mbtiScores.S} |\n`
      markdown += `| 判断方式 | ${mbtiScores.T >= mbtiScores.F ? '思考(T)' : '情感(F)'} | ${mbtiScores.T >= mbtiScores.F ? mbtiScores.T : mbtiScores.F} | ${mbtiScores.T >= mbtiScores.F ? '情感(F)' : '思考(T)'} | ${mbtiScores.T >= mbtiScores.F ? mbtiScores.F : mbtiScores.T} |\n`
      markdown += `| 生活方式 | ${mbtiScores.J >= mbtiScores.P ? '判断(J)' : '知觉(P)'} | ${mbtiScores.J >= mbtiScores.P ? mbtiScores.J : mbtiScores.P} | ${mbtiScores.J >= mbtiScores.P ? '知觉(P)' : '判断(J)'} | ${mbtiScores.J >= mbtiScores.P ? mbtiScores.P : mbtiScores.J} |\n\n`
      markdown += `## 维度解释\n\n`
      markdown += `| 字母 | 含义 | 说明 |\n`
      markdown += `|-----|------|------|\n`
      markdown += `| **E** | 外向(Extraversion) | 关注外部世界，从与人交往中获得能量 |\n`
      markdown += `| **I** | 内向(Introversion) | 关注内心世界，从独处中获得能量 |\n`
      markdown += `| **S** | 感觉(Sensing) | 关注具体的细节和现实 |\n`
      markdown += `| **N** | 直觉(Intuition) | 关注整体模式和可能性 |\n`
      markdown += `| **T** | 思考(Thinking) | 基于逻辑和分析做决定 |\n`
      markdown += `| **F** | 情感(Feeling) | 基于价值观和他人感受做决定 |\n`
      markdown += `| **J** | 判断(Judgment) | 喜欢有计划、有条理的生活方式 |\n`
      markdown += `| **P** | 知觉(Perception) | 喜欢灵活、开放的生活方式 |\n\n`
    } else {
      // 普通量表计分逻辑
      const totalScore = Object.values(answers).reduce<number>((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
      const avgScore = totalScore / Object.keys(answers).length
      
      markdown += `## 基本信息\n\n`
      markdown += `- 量表名称: ${scaleTitle}\n`
      markdown += `- 题目数量: ${questions.length}题\n`
      markdown += `- 总分: ${totalScore}\n`
      markdown += `- 平均分: ${avgScore.toFixed(2)}\n\n`
    }
    
    markdown += `## 答题详情\n\n`
    questions.forEach((q, index) => {
      const answer = answers[q.id]
      const selectedOption = q.options.find(o => o.value === answer)
      markdown += `**${index + 1}. ${q.title}**\n`
      markdown += `> 您的选择: ${selectedOption ? selectedOption.label : '未作答'}\n\n`
    })
    
    if (aiReport) {
      markdown += `## AI分析报告\n\n`
      markdown += `${aiReport}\n\n`
    }
    
    markdown += `---\n\n`
    markdown += `*本报告由心理测评系统自动生成，仅供参考。如有心理健康方面的困扰，请咨询专业心理咨询师。*\n`
    
    return markdown
  }
}
