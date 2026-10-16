import express from 'express'
import cors from 'cors'
import { optionalUser } from './auth'
import { errorHandler, HttpError } from './lib/http'
import { publicRoutes } from './routes/public'
import { adminRoutes } from './routes/admin'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/], allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Admin-Token'] }))
  app.use(express.json({ limit: '100kb' }))
  app.use(optionalUser)
  app.use('/api/admin', adminRoutes())
  app.use('/api', publicRoutes())
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'No such endpoint.')))
  app.use(errorHandler)
  return app
}
