import { Router } from 'express'
import {
  getVideoSeriesList,
  getVideoSeriesDetail,
  getVideoEpisodeDetail,
  getVideoCategories,
  createVideoSeries,
  updateVideoSeries,
  deleteVideoSeries,
  createVideoEpisode,
  updateVideoEpisode,
  deleteVideoEpisode
} from '../controllers/videoController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// 公开接口
router.get('/series', getVideoSeriesList)                          // 获取视频系列列表
router.get('/series/:id', getVideoSeriesDetail)                     // 获取视频系列详情（含所有集数）
router.get('/episodes/:id', getVideoEpisodeDetail)                  // 获取单集详情
router.get('/categories', getVideoCategories)                       // 获取分类列表

// 管理员接口
router.post('/series', authenticateToken, createVideoSeries)              // 创建视频系列
router.put('/series/:id', authenticateToken, updateVideoSeries)           // 更新视频系列
router.delete('/series/:id', authenticateToken, deleteVideoSeries)        // 删除视频系列

router.post('/episodes', authenticateToken, createVideoEpisode)           // 创建视频集数
router.put('/episodes/:id', authenticateToken, updateVideoEpisode)         // 更新视频集数
router.delete('/episodes/:id', authenticateToken, deleteVideoEpisode)     // 删除视频集数

export default router
