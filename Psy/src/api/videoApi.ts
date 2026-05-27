/**
 * 视频模块 API 接口
 * 本文件已集成到后端 /api/videos 路由
 * 
 * 接口说明：
 * 
 * GET /api/videos/series
 *   获取视频系列列表
 *   参数：category (可选): 'psychology' | 'philosophy'
 *   返回：{
 *     success: true,
 *     data: [{
 *       id: number,
 *       title: string,
 *       cover_image: string,
 *       author: string,
 *       source: 'bilibili' | 'youtube' | 'other',
 *       description: string,
 *       episode_count: number,
 *       preview_episodes: [{ id, episode_number, title, thumbnail }]
 *     }]
 *   }
 * 
 * GET /api/videos/series/:id
 *   获取视频系列详情（含所有集数）
 *   返回：{
 *     success: true,
 *     data: {
 *       ...seriesInfo,
 *       episodes: [{ id, episode_number, title, video_url, bv_number, duration, description, intro }]
 *     }
 *   }
 * 
 * GET /api/videos/episodes/:id
 *   获取单集详情
 *   返回：{
 *     success: true,
 *     data: { id, series_title, episode_number, title, video_url, bv_number, description, intro }
 *   }
 * 
 * GET /api/videos/categories
 *   获取视频分类列表
 *   返回：{ success: true, data: [{ category: string, count: number }] }
 * 
 * // 以下为管理员接口，需要登录
 * POST /api/videos/series           - 创建视频系列
 * PUT /api/videos/series/:id        - 更新视频系列
 * DELETE /api/videos/series/:id     - 删除视频系列
 * POST /api/videos/episodes        - 创建视频集数
 * PUT /api/videos/episodes/:id     - 更新视频集数
 * DELETE /api/videos/episodes/:id  - 删除视频集数
 */

export const videoApi = {
  // 获取视频系列列表
  getSeriesList: (category?: string) => {
    const url = category ? `/api/videos/series?category=${encodeURIComponent(category)}` : '/api/videos/series'
    return fetch(url)
  },
  
  // 获取视频系列详情
  getSeriesDetail: (id: number) => {
    return fetch(`/api/videos/series/${id}`)
  },
  
  // 获取单集详情
  getEpisodeDetail: (id: number) => {
    return fetch(`/api/videos/episodes/${id}`)
  },
  
  // 获取分类列表
  getCategories: () => {
    return fetch('/api/videos/categories')
  }
}
