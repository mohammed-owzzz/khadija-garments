import bcrypt from 'bcryptjs'
import { pathToFileURL } from 'url'
import User from '../models/User.js'

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ isAdmin: true })
    if (existingAdmin) return // Only one admin allowed — already exists

    const email    = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
      console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed')
      return
    }

    const salt           = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await User.create({
      name:     'Admin',
      email:    email.toLowerCase(),
      phone:    '0000000000',
      password: hashedPassword,
      isAdmin:  true,
    })

    console.log(`✅ Admin account created: ${email}`)
  } catch (err) {
    console.error('Admin seed error:', err.message)
  }
}

export default seedAdmin

// ── Allow running directly:  node scripts/seedAdmin.js ─────────────
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = async () => {
    await import('dotenv/config')
    const mongoose = (await import('mongoose')).default
    const { default: connectDB } = await import('../config/db.js')
    await connectDB()
    await seedAdmin()
    await mongoose.disconnect()
    process.exit(0)
  }
  run()
}