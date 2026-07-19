import rateLimit from 'express-rate-limit'

// Blocks password-guessing / credential stuffing on the login endpoints.
// Only FAILED attempts count (skipSuccessfulRequests), so real users who log
// in correctly are never locked out.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 8,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
})

// Prevents OTP email-bombing and abuse (each send costs a real email).
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please try again in 15 minutes.' },
})

// Stops brute-forcing the 6-digit OTP code. Correct codes are not counted.
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many incorrect OTP attempts. Please try again in 15 minutes.' },
})

// A sane overall ceiling for the whole API to blunt scraping / DoS attempts.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
})