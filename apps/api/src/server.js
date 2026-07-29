import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './middleware/index.js'
import emailRoutes from './routes/email.routes.js'
import authRoutes from './routes/auth.routes.js'

const app = express()
const PORT = process.env.PORT || 8080

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/email', emailRoutes)
app.use('/api/auth', authRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(` API server running on port ${PORT}`)
})
