import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './middleware/index.js'
import emailRoutes from './routes/email.routes.js'
import authRoutes from './routes/auth.routes.js'
import formatRoutes from './routes/format.routes.js'

const app = express()
const PORT = process.env.PORT || 8081

app.use(helmet())
const corsOrigin = process.env.CORS_ORIGIN
app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : '*',
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/email', emailRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/formats', formatRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(` API server running on port ${PORT}`)
})
