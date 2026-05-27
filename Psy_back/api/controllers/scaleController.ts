import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件所在的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 问卷数据文件路径 - 使用绝对路径，确保无论从哪里启动都能找到
const getBasePath = () => {
  // 优先使用环境变量配置的路径
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  // 默认使用项目根目录下的 public 文件夹
  return path.resolve(__dirname, '../../public');
};

const SCALES_FILE = path.join(getBasePath(), 'data', 'scales.json');
const QUESTIONS_DIR = path.join(getBasePath(), 'questions');
const REPORTS_DIR = path.join(getBasePath(), 'reports');

// 读取问卷数据
function readScalesData() {
  try {
    console.log('[Scales] 读取量表数据:', SCALES_FILE);
    const data = fs.readFileSync(SCALES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Scales] 读取量表数据失败:', error);
    return { scales: [] };
  }
}

// 保存问卷数据
function writeScalesData(data: any) {
  // 确保目录存在
  const dir = path.dirname(SCALES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SCALES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 确保目录存在
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 获取所有问卷
export const getAllScales = async (req: Request, res: Response) => {
  try {
    const data = readScalesData();
    res.json({
      success: true,
      scales: data.scales,
      total: data.scales.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取问卷列表失败' });
  }
};

// 获取单个问卷详情
export const getScaleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = readScalesData();
    const scale = data.scales.find((s: any) => s.id === parseInt(id));
    
    if (!scale) {
      return res.status(404).json({ success: false, error: '问卷不存在' });
    }

    // 读取题目
    let questions = [];
    if (scale.questions_path) {
      try {
        const questionsFile = path.join(process.cwd(), 'public', scale.questions_path);
        const questionsData = fs.readFileSync(questionsFile, 'utf-8');
        const parsed = JSON.parse(questionsData);
        
        // 支持多种格式
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && parsed[0].questions) {
            // 格式: [{ scale_id, scale_title, questions: [...] }]
            questions = parsed[0].questions;
          } else {
            // 格式: [{ id, title, options: [...] }]
            questions = parsed;
          }
        } else if (parsed.questions) {
          // 格式: { scale_id, scale_title, questions: [...] }
          questions = parsed.questions;
        }
      } catch (e) {
        console.error('读取题目文件失败:', e);
        questions = [];
      }
    }

    // 读取报告
    let report = '';
    if (scale.report_path) {
      try {
        const reportFile = path.join(process.cwd(), 'public', scale.report_path);
        report = fs.readFileSync(reportFile, 'utf-8');
      } catch (e) {
        report = '';
      }
    }

    res.json({
      success: true,
      scale: {
        ...scale,
        questions,
        report
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取问卷详情失败' });
  }
};

// 创建问卷
export const createScale = async (req: Request, res: Response) => {
  try {
    const { title, brief, tags, category, cover_image, questions, report } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: '问卷标题不能为空' });
    }

    // 确保目录存在
    ensureDir(QUESTIONS_DIR);
    ensureDir(REPORTS_DIR);

    const data = readScalesData();
    
    // 生成新ID
    const maxId = data.scales.reduce((max: number, s: any) => Math.max(max, s.id), 0);
    const newId = maxId + 1;
    
    // 生成文件路径
    const questionsPath = `/questions/scale-${newId}-questions.json`;
    const reportPath = `/reports/scale-${newId}-report.md`;

    // 创建问卷对象
    const newScale = {
      id: newId,
      title,
      brief: brief || '',
      tags: tags || [],
      category: category || 'general',
      cover_image: cover_image || '',
      question_count: questions?.length || 0,
      questions_path: questionsPath,
      report_path: reportPath
    };

    // 保存题目文件
    if (questions && questions.length > 0) {
      fs.writeFileSync(path.join(process.cwd(), 'public', questionsPath), JSON.stringify(questions, null, 2), 'utf-8');
    }

    // 保存报告文件
    if (report) {
      fs.writeFileSync(path.join(process.cwd(), 'public', reportPath), report, 'utf-8');
    }

    // 更新问卷列表
    data.scales.push(newScale);
    writeScalesData(data);

    res.json({ success: true, scale: newScale });
  } catch (error) {
    console.error('创建问卷失败:', error);
    res.status(500).json({ success: false, error: '创建问卷失败' });
  }
};

// 更新问卷
export const updateScale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, brief, tags, category, cover_image, questions, report } = req.body;
    
    // 确保目录存在
    ensureDir(QUESTIONS_DIR);
    ensureDir(REPORTS_DIR);
    
    const data = readScalesData();
    const index = data.scales.findIndex((s: any) => s.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: '问卷不存在' });
    }

    const oldScale = data.scales[index];

    // 更新题目文件
    if (questions) {
      const questionsPath = oldScale.questions_path || `/questions/scale-${id}-questions.json`;
      fs.writeFileSync(path.join(process.cwd(), 'public', questionsPath), JSON.stringify(questions, null, 2), 'utf-8');
    }

    // 更新报告文件
    if (report !== undefined) {
      const reportPath = oldScale.report_path || `/reports/scale-${id}-report.md`;
      fs.writeFileSync(path.join(process.cwd(), 'public', reportPath), report, 'utf-8');
    }

    // 更新问卷数据
    data.scales[index] = {
      ...oldScale,
      title: title || oldScale.title,
      brief: brief !== undefined ? brief : oldScale.brief,
      tags: tags || oldScale.tags,
      category: category || oldScale.category,
      cover_image: cover_image !== undefined ? cover_image : oldScale.cover_image,
      question_count: questions ? questions.length : oldScale.question_count
    };

    writeScalesData(data);

    res.json({ success: true, scale: data.scales[index] });
  } catch (error) {
    console.error('更新问卷失败:', error);
    res.status(500).json({ success: false, error: '更新问卷失败' });
  }
};

// 删除问卷
export const deleteScale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = readScalesData();
    const index = data.scales.findIndex((s: any) => s.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: '问卷不存在' });
    }

    const scale = data.scales[index];

    // 删除题目文件
    if (scale.questions_path) {
      try {
        fs.unlinkSync(path.join(process.cwd(), 'public', scale.questions_path));
      } catch (e) {
        // 文件可能不存在，忽略
      }
    }

    // 删除报告文件
    if (scale.report_path) {
      try {
        fs.unlinkSync(path.join(process.cwd(), 'public', scale.report_path));
      } catch (e) {
        // 文件可能不存在，忽略
      }
    }

    // 从列表中移除
    data.scales.splice(index, 1);
    writeScalesData(data);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除问卷失败:', error);
    res.status(500).json({ success: false, error: '删除问卷失败' });
  }
};

// 获取题目文件
export const getQuestions = async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ success: false, error: '缺少文件路径' });
    }

    const fullPath = path.join(process.cwd(), 'public', filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);
    
    // 支持多种格式
    let questions = [];
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].questions) {
        // 格式: [{ scale_id, scale_title, questions: [...] }]
        questions = data[0].questions;
      } else {
        // 格式: [{ id, title, options: [...] }]
        questions = data;
      }
    } else if (data.questions) {
      // 格式: { scale_id, scale_title, questions: [...] }
      questions = data.questions;
    }
    
    res.json({ success: true, questions });
  } catch (error) {
    console.error('获取题目失败:', error);
    res.status(500).json({ success: false, error: '获取题目失败' });
  }
};

// 获取报告文件
export const getReport = async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ success: false, error: '缺少文件路径' });
    }

    const fullPath = path.join(process.cwd(), 'public', filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    res.json({ success: true, report: content });
  } catch (error) {
    console.error('获取报告失败:', error);
    res.status(500).json({ success: false, error: '获取报告失败' });
  }
};
