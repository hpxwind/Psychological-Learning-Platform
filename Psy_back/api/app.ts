/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import effectRoutes from './routes/effects.js'
import dailyEffectRoutes from './routes/dailyEffect.js'
import bookRoutes from './routes/books.js'
import searchRoutes from './routes/search.js'
import uploadRoutes from './routes/upload.js'
import aiRoutes from './routes/ai.js'
import videoRoutes from './routes/videos.js'
import scaleAnalyzeRoutes from './routes/scaleAnalyze.js'
import scaleRoutes from './routes/scales.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

// CORS 配置 - 允许所有来源，生产环境可限制
app.use(cors({
  origin: true,  // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from public folder (especially uploads)
// Assuming public is at root (../public from api folder)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/effects', effectRoutes)
app.use('/api/daily-effect', dailyEffectRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/videos', videoRoutes)
app.use('/api/scale', scaleAnalyzeRoutes)
app.use('/api/scales', scaleRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
