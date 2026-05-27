import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

// 获取public目录的绝对路径
const getPublicPath = () => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname)
  return path.join(currentDir, '../../public')
}

// 确保目录存在
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 获取所有量表列表
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const publicPath = getPublicPath()
    const scalesPath = path.join(publicPath, 'data/scales.json')
    
    if (!fs.existsSync(scalesPath)) {
      return res.json({ success: false, error: '量表数据文件不存在' })
    }
    
    const data = fs.readFileSync(scalesPath, 'utf-8')
    const scalesData = JSON.parse(data)
    
    res.json({ success: true, scales: scalesData.scales })
  } catch (error) {
    console.error('获取量表列表失败:', error)
    res.status(500).json({ success: false, error: '获取量表列表失败' })
  }
})

/**
 * 根据ID获取单个量表详情（包含题目和报告）
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const scaleId = Number(req.params.id)
    const publicPath = getPublicPath()
    const scalesPath = path.join(publicPath, 'data/scales.json')
    
    if (!fs.existsSync(scalesPath)) {
      return res.status(404).json({ success: false, error: '量表数据文件不存在' })
    }
    
    const data = fs.readFileSync(scalesPath, 'utf-8')
    const scalesData = JSON.parse(data)
    
    const scale = scalesData.scales.find((s: any) => s.id === scaleId)
    
    if (!scale) {
      return res.status(404).json({ success: false, error: '量表不存在' })
    }
    
    // 读取题目文件
    let questions: any[] = []
    if (scale.questions_path) {
      const questionsPath = path.join(publicPath, scale.questions_path)
      if (fs.existsSync(questionsPath)) {
        const questionsData = fs.readFileSync(questionsPath, 'utf-8')
        const parsed = JSON.parse(questionsData)
        // eq-questions.json 格式: [{ scale_id, scale_title, questions: [...] }]
        // 也支持直接是数组格式: [{ id, title, options: [...] }]
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && parsed[0].questions) {
            // 格式1: 数组第一个元素有 questions 字段
            questions = parsed[0].questions
          } else {
            // 格式2: 直接是题目数组
            questions = parsed
          }
        } else if (parsed.questions) {
          // 格式3: 对象形式有 questions 字段
          questions = parsed.questions
        }
      }
    }
    
    // 读取报告文件
    let report = ''
    if (scale.report_path) {
      const reportPath = path.join(publicPath, scale.report_path)
      if (fs.existsSync(reportPath)) {
        report = fs.readFileSync(reportPath, 'utf-8')
      }
    }
    
    res.json({
      success: true,
      scale: {
        ...scale,
        questions,
        report
      }
    })
  } catch (error) {
    console.error('获取量表详情失败:', error)
    res.status(500).json({ success: false, error: '获取量表详情失败' })
  }
})

/**
 * 获取量表题目
 */
router.get('/questions', (req: Request, res: Response) => {
  try {
    const { path: questionsPath } = req.query
    
    if (!questionsPath || typeof questionsPath !== 'string') {
      return res.status(400).json({ success: false, error: '缺少questionsPath参数' })
    }
    
    const publicPath = getPublicPath()
    const fullPath = path.join(publicPath, questionsPath)
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: '题目文件不存在' })
    }
    
    const data = fs.readFileSync(fullPath, 'utf-8')
    const parsed = JSON.parse(data)
    
    // 支持多种格式
    let questions: any[] = []
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && parsed[0].questions) {
        // 格式1: [{ scale_id, scale_title, questions: [...] }]
        questions = parsed[0].questions
      } else {
        // 格式2: 直接是题目数组 [{ id, title, options: [...] }]
        questions = parsed
      }
    } else if (parsed.questions) {
      // 格式3: { scale_id, scale_title, questions: [...] }
      questions = parsed.questions
    }
    
    res.json({ success: true, questions })
  } catch (error) {
    console.error('获取题目失败:', error)
    res.status(500).json({ success: false, error: '获取题目失败' })
  }
})

/**
 * 获取量表研究报告
 */
router.get('/report', (req: Request, res: Response) => {
  try {
    const { path: reportPath } = req.query
    
    if (!reportPath || typeof reportPath !== 'string') {
      return res.status(400).json({ success: false, error: '缺少reportPath参数' })
    }
    
    const publicPath = getPublicPath()
    const fullPath = path.join(publicPath, reportPath)
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: '报告文件不存在' })
    }
    
    const report = fs.readFileSync(fullPath, 'utf-8')
    
    res.json({ success: true, report })
  } catch (error) {
    console.error('获取研究报告失败:', error)
    res.status(500).json({ success: false, error: '获取研究报告失败' })
  }
})

export default router
