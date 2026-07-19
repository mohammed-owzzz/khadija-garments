import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Otp from '../models/Otp.js'
import { sendOtpEmail } from '../utils/sendEmail.js'

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString()

const OTP_TTL_MS = 10 * 60 * 1000

// ── Password strength validator ───────────────────────────────────────────────
const validatePasswordStrength = (password) => {
  if (password.length < 8)
    return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password))
    return 'Password must contain at least one uppercase letter'
  if (!/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/.test(password))
    return 'Password must contain at least one special character'
  if ((password.match(/\d/g) || []).length < 3)
    return 'Password must contain at least 3 numbers'
  return null
}

// ── REGISTER — Step 1 ────────────────────────────────────────────────────────
export const sendRegisterOtp = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'Name, email and password are required' })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address' })

    if (phone && !/^\d{10}$/.test(phone))
      return res.status(400).json({ message: 'Phone number must be 10 digits' })

    const passwordError = validatePasswordStrength(password)
    if (passwordError)
      return res.status(400).json({ message: passwordError })

    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail)
      return res.status(400).json({ message: 'An account with this email already exists' })

    if (phone) {
      const existingPhone = await User.findOne({ phone })
      if (existingPhone)
        return res.status(400).json({ message: 'An account with this phone number already exists' })
    }

    const salt           = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const emailOtp       = generateOtp()

    await Otp.deleteMany({ email: email.toLowerCase(), type: 'register' })
    await Otp.create({
      email: email.toLowerCase(),
      phone: phone || '',
      emailOtp,
      pendingUser: {
        name: name.trim(),
        email: email.toLowerCase(),
        phone: phone || '',
        password: hashedPassword,
      },
      type: 'register',
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    })

    await sendOtpEmail(email, emailOtp, 'register')

    const maskedEmail = email.replace(/(.{2})[^@]+(@.+)/, '$1***$2')
    res.status(200).json({ message: 'OTP sent', maskedEmail })
  } catch (error) {
    console.error('sendRegisterOtp error:', error)
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' })
  }
}

// ── REGISTER — Step 2 ────────────────────────────────────────────────────────
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, emailOtp } = req.body

    const record = await Otp.findOne({ email: email.toLowerCase(), type: 'register' })
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' })

    if (record.emailOtp !== emailOtp?.trim())
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' })

    const { name, email: userEmail, phone, password } = record.pendingUser
    const user = await User.create({ name, email: userEmail, phone, password })
    await Otp.deleteOne({ _id: record._id })

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, isAdmin: user.isAdmin, token: generateToken(user._id),
    })
  } catch (error) {
    console.error('verifyRegisterOtp error:', error)
    res.status(500).json({ message: 'Verification failed. Please try again.' })
  }
}

// ── LOGIN — direct, no OTP ───────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || user.isAdmin)
      return res.status(401).json({ message: 'Invalid email or password' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' })

    res.status(200).json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, isAdmin: user.isAdmin, token: generateToken(user._id),
    })
  } catch (error) {
    console.error('loginUser error:', error)
    res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────────
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email: email.toLowerCase(), isAdmin: true })
    if (!user)
      return res.status(401).json({ message: 'Invalid admin credentials' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid admin credentials' })

    res.status(200).json({
      _id: user._id, name: user.name, email: user.email,
      isAdmin: user.isAdmin, token: generateToken(user._id),
    })
  } catch (error) {
    console.error('loginAdmin error:', error)
    res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}

// ── RESEND OTP ────────────────────────────────────────────────────────────────
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body

    const record = await Otp.findOne({ email: email.toLowerCase(), type: 'register' })
    if (!record)
      return res.status(400).json({ message: 'No pending session found. Please start over.' })

    const emailOtp   = generateOtp()
    record.emailOtp  = emailOtp
    record.expiresAt = new Date(Date.now() + OTP_TTL_MS)
    await record.save()

    await sendOtpEmail(email, emailOtp, 'register')
    res.status(200).json({ message: 'OTP resent successfully' })
  } catch (error) {
    console.error('resendOtp error:', error)
    res.status(500).json({ message: 'Failed to resend. Please try again.' })
  }
}