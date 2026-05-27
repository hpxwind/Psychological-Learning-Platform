import type { Request, Response } from 'express'
import db from '../config/db.js'

/**
 * 获取所有视频系列列表
 */
export const getVideoSeriesList = async (req: Request, res: Response) => {
  try {
    const { category } = req.query
    
    let sql = 'SELECT * FROM video_series WHERE status = 1'
    const params: any[] = []
    
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    
    sql += ' ORDER BY display_order ASC, created_at DESC'
    
    const [rows] = await db.query(sql, params)
    
    // 获取每个系列的集数
    const seriesWithCount = await Promise.all(
      (rows as any[]).map(async (series) => {
        const [episodes] = await db.query(
          'SELECT id, episode_number, title, thumbnail FROM video_episodes WHERE series_id = ? AND status = 1 ORDER BY episode_number ASC LIMIT 5',
          [series.id]
        )
        const [countResult] = await db.query(
          'SELECT COUNT(*) as total FROM video_episodes WHERE series_id = ? AND status = 1',
          [series.id]
        )
        return {
          ...series,
          episode_count: (countResult as any[])[0].total,
          preview_episodes: episodes
        }
      })
    )
    
    res.json({
      success: true,
      data: seriesWithCount
    })
  } catch (error) {
    console.error('获取视频系列列表错误:', error)
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    })
  }
}

/**
 * 获取视频系列详情
 */
export const getVideoSeriesDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // 获取系列信息
    const [series] = await db.query(
      'SELECT * FROM video_series WHERE id = ? AND status = 1',
      [id]
    )
    
    if (!(series as any[]).length) {
      return res.status(404).json({
        success: false,
        error: '视频系列不存在'
      })
    }
    
    const seriesData = (series as any[])[0]
    
    // 获取所有集数
    const [episodes] = await db.query(
      'SELECT * FROM video_episodes WHERE series_id = ? AND status = 1 ORDER BY episode_number ASC',
      [id]
    )
    
    res.json({
      success: true,
      data: {
        ...seriesData,
        episodes
      }
    })
  } catch (error) {
    console.error('获取视频系列详情错误:', error)
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    })
  }
}

/**
 * 获取单集详情
 */
export const getVideoEpisodeDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const [episode] = await db.query(
      'SELECT e.*, s.title as series_title, s.author as series_author FROM video_episodes e LEFT JOIN video_series s ON e.series_id = s.id WHERE e.id = ? AND e.status = 1',
      [id]
    )
    
    if (!(episode as any[]).length) {
      return res.status(404).json({
        success: false,
        error: '视频不存在'
      })
    }
    
    res.json({
      success: true,
      data: (episode as any[])[0]
    })
  } catch (error) {
    console.error('获取视频详情错误:', error)
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    })
  }
}

/**
 * 获取视频分类列表
 */
export const getVideoCategories = async (_req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT category, COUNT(*) as count FROM video_series WHERE status = 1 GROUP BY category'
    )
    
    res.json({
      success: true,
      data: rows
    })
  } catch (error) {
    console.error('获取分类列表错误:', error)
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    })
  }
}

/**
 * 创建视频系列（管理员）
 */
export const createVideoSeries = async (req: Request, res: Response) => {
  try {
    const { title, cover_image, author, source, source_url, category, description, intro, display_order, status } = req.body
    
    const [result] = await db.query(
      `INSERT INTO video_series (title, cover_image, author, source, source_url, category, description, intro, display_order, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, cover_image, author, source, source_url, category, description, intro, display_order || 0, status ?? 1]
    )
    
    res.json({
      success: true,
      data: { id: (result as any).insertId }
    })
  } catch (error) {
    console.error('创建视频系列错误:', error)
    res.status(500).json({
      success: false,
      error: '创建失败'
    })
  }
}

/**
 * 更新视频系列（管理员）
 */
export const updateVideoSeries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, cover_image, author, source, source_url, category, description, intro, display_order, status } = req.body
    
    await db.query(
      `UPDATE video_series SET title = ?, cover_image = ?, author = ?, source = ?, source_url = ?, category = ?, description = ?, intro = ?, display_order = ?, status = ? WHERE id = ?`,
      [title, cover_image, author, source, source_url, category, description, intro, display_order, status, id]
    )
    
    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新视频系列错误:', error)
    res.status(500).json({
      success: false,
      error: '更新失败'
    })
  }
}

/**
 * 删除视频系列（管理员）
 */
export const deleteVideoSeries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    await db.query('DELETE FROM video_series WHERE id = ?', [id])
    
    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除视频系列错误:', error)
    res.status(500).json({
      success: false,
      error: '删除失败'
    })
  }
}

/**
 * 创建视频集数（管理员）
 */
export const createVideoEpisode = async (req: Request, res: Response) => {
  try {
    const { series_id, episode_number, title, video_url, bv_number, duration, description, intro, thumbnail, status } = req.body
    
    const [result] = await db.query(
      `INSERT INTO video_episodes (series_id, episode_number, title, video_url, bv_number, duration, description, intro, thumbnail, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [series_id, episode_number, title, video_url, bv_number, duration, description, intro, thumbnail, status ?? 1]
    )
    
    res.json({
      success: true,
      data: { id: (result as any).insertId }
    })
  } catch (error) {
    console.error('创建视频集数错误:', error)
    res.status(500).json({
      success: false,
      error: '创建失败'
    })
  }
}

/**
 * 更新视频集数（管理员）
 */
export const updateVideoEpisode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { episode_number, title, video_url, bv_number, duration, description, intro, thumbnail, status } = req.body
    
    await db.query(
      `UPDATE video_episodes SET episode_number = ?, title = ?, video_url = ?, bv_number = ?, duration = ?, description = ?, intro = ?, thumbnail = ?, status = ? WHERE id = ?`,
      [episode_number, title, video_url, bv_number, duration, description, intro, thumbnail, status, id]
    )
    
    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新视频集数错误:', error)
    res.status(500).json({
      success: false,
      error: '更新失败'
    })
  }
}

/**
 * 删除视频集数（管理员）
 */
export const deleteVideoEpisode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    await db.query('DELETE FROM video_episodes WHERE id = ?', [id])
    
    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除视频集数错误:', error)
    res.status(500).json({
      success: false,
      error: '删除失败'
    })
  }
}
