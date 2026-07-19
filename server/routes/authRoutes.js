import express from 'express'
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  loginUser,
  loginAdmin,
  resendOtp,
} from '../controllers/authController.js'
import { loginLimiter, otpLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/send-register-otp', otpLimiter, sendRegisterOtp)
router.post('/verify-register', otpVerifyLimiter, verifyRegisterOtp)
router.post('/login', loginLimiter, loginUser)
router.post('/admin-login', loginLimiter, loginAdmin)
router.post('/resend-otp', otpLimiter, resendOtp)

export default router