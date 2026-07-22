import express from 'express'
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  loginUser,
  loginAdmin,
  verifyAdminOtp,
  resendAdminOtp,
  resendOtp,
  sendResetOtp,
  resetPassword,
} from '../controllers/authController.js'
import { loginLimiter, otpLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/send-register-otp', otpLimiter, sendRegisterOtp)
router.post('/verify-register', otpVerifyLimiter, verifyRegisterOtp)
router.post('/login', loginLimiter, loginUser)
router.post('/admin-login', loginLimiter, loginAdmin)
router.post('/verify-admin-login', otpVerifyLimiter, verifyAdminOtp)
router.post('/resend-admin-otp', otpLimiter, resendAdminOtp)
router.post('/resend-otp', otpLimiter, resendOtp)
router.post('/forgot-password', otpLimiter, sendResetOtp)
router.post('/reset-password', otpVerifyLimiter, resetPassword)

export default router
