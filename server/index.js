import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { apiLimiter } from './middleware/rateLimiter.js'
import { sanitizeRequest } from './middleware/sanitize.js'
import connectDB from './config/db.js'
import seedAdmin from './scripts/seedAdmin.js'
import authRoutes from './routes/authRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import contactRoutes from './routes/contactRoutes.js'

connectDB().then(() => seedAdmin())

const app = express()

// Trust the first proxy so client IPs are correct behind a host/reverse proxy
app.set('trust proxy', 1)

// Security headers: clickjacking, MIME-sniffing, XSS, stack disclosure, etc.
app.use(helmet())

// ── CORS: allow both local dev and production origin ──────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,          // set CLIENT_URL=https://yourdomain.com in prod
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server (no origin) or allowed list
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '2mb' }))   // prevent oversized JSON payloads
app.use(cookieParser())

// Strip NoSQL-injection operators ($ and .) from every request
app.use(sanitizeRequest)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('Khadija Garments API running'))

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter)  // overall API rate limit (applies to every /api route)

app.use('/api/auth',       authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products',   productRoutes)
app.use('/api/orders',     orderRoutes)
app.use('/api/contact',    contactRoutes)

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  const status = err.status || 500
  const isProd = process.env.NODE_ENV === 'production'
  res.status(status).json({
    message: isProd ? 'Something went wrong. Please try again.' : (err.message || 'Internal server error'),
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))