import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import OtpInput from '../components/OtpInput'
import HoverButton from '../components/HoverButton'
import { scrollToFirstError } from '../utils/formScroll'
import api from '../api/axios'

const BRAND_MESSAGES = [
  'PREMIUM QUALITY.',
  'TRUSTED PAN-INDIA.',
  '100+ DESIGNS.',
  'FAST DISPATCH.',
  'FABRIC MEETS FINESSE.',
]
const RESEND_MESSAGES = [
  'FRESH CODE ON ITS WAY! ^_^',
  'NEW CODE SENT! >O<',
  'CODE RESENT! YOU GOT THIS >W<',
  'CHECK YOUR INBOX! ^O^',
]
const FACES = ['>O<', '^_^', '>W<', '^O^', '-_-']
const SEND_HOVER    = ['SEND IT! ^_^', "LET'S GO! >O<", 'ALMOST! >W<', 'READY! ^O^']
const SEND_LOADING  = ['SENDING CODE >O<', 'WARMING UP THE INBOX ^_^', 'ALMOST READY >W<', 'HANG TIGHT ^O^']
const RESET_HOVER   = ['RESET IT! ^_^', "LET'S DO IT! >O<", 'ALMOST IN! >W<', 'CONFIRM! ^O^']
const RESET_LOADING = ['RESETTING >O<', 'HANG TIGHT ^_^', 'UPDATING YOUR PASSWORD >W<', 'ALMOST DONE ^O^']

function ForgotPassword() {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const textColor   = isDark ? 'text-brand-white' : 'text-brand-black'
  const inputBorder = isDark ? 'border-brand-grey' : 'border-brand-lightgrey'
  const inputText   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const pageBg      = isDark ? 'bg-brand-black'    : 'bg-brand-white'

  const [step, setStep] = useState('email')

  // Step 1 (email) state
  const [email, setEmail]             = useState('')
  const [emailError, setEmailError]   = useState('')
  const [shakeEmail, setShakeEmail]   = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')

  // Step 2 (otp + new password) state
  const [emailOtp, setEmailOtp]                 = useState('')
  const [otpError, setOtpError]                 = useState('')
  const [shakeOtp, setShakeOtp]                 = useState(false)
  const [password, setPassword]                 = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [fieldErrors, setFieldErrors]           = useState({})
  const [shakeFields, setShakeFields]           = useState({})
  const [resetServerError, setResetServerError] = useState('')
  const [resetLoading, setResetLoading]         = useState(false)
  const [successMsg, setSuccessMsg]             = useState('')

  // Resend state
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess]   = useState(false)
  const [resendMsgIdx, setResendMsgIdx]     = useState(0)

  // Left-panel animation state
  const [msgIdx,  setMsgIdx]  = useState(0)
  const [faceIdx, setFaceIdx] = useState(0)
  const [dotStep, setDotStep] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx((i)  => (i + 1) % BRAND_MESSAGES.length)
      setFaceIdx((i) => (i + 1) % FACES.length)
    }, 2800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setDotStep((d) => (d + 1) % 4), 400)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    if (!resendSuccess) return
    const t = setTimeout(() => setResendSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [resendSuccess])

  const softNavigate = (path) => {
    setLeaving(true)
    setTimeout(() => navigate(path), 350)
  }

  const triggerOtpShake = () => {
    setShakeOtp(true)
    setTimeout(() => setShakeOtp(false), 400)
  }

  const handleEmailChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9@._+\-]/g, '')
    setEmail(cleaned)
    if (emailError) setEmailError('')
    if (serverError) setServerError('')
  }

  const validatePassword = (pw) => {
    if (!pw.trim()) return 'Password is required'
    if (pw.length < 8) return 'Minimum 8 characters'
    if (!/[A-Z]/.test(pw)) return 'Must include at least one uppercase letter'
    if (!/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/.test(pw)) return 'Must include at least one special character'
    if ((pw.match(/\d/g) || []).length < 3) return 'Must include at least 3 numbers'
    return ''
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      setShakeEmail(true)
      setTimeout(() => setShakeEmail(false), 400)
      return
    }
    setLoading(true)
    setServerError('')
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setMaskedEmail(data.maskedEmail)
      setStep('otp')
      setResendCooldown(60)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
      setShakeEmail(true)
      setTimeout(() => setShakeEmail(false), 400)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (emailOtp.replace(/\s/g, '').length !== 6) {
      setOtpError('Enter the 6-digit OTP')
      triggerOtpShake()
      return
    }
    const errs = {}
    const pwErr = validatePassword(password)
    if (pwErr) errs.password = pwErr
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      setShakeFields(errs)
      scrollToFirstError(errs, { order: ['password', 'confirmPassword'] })
      setTimeout(() => setShakeFields({}), 400)
      return
    }
    setResetLoading(true)
    setResetServerError('')
    try {
      await api.post('/auth/reset-password', { email, emailOtp, password })
      setSuccessMsg('Password reset! Redirecting to login\u2026')
      setTimeout(() => softNavigate('/login'), 1400)
    } catch (err) {
      setResetServerError(err.response?.data?.message || 'Reset failed. Please try again.')
      triggerOtpShake()
    } finally {
      setResetLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/forgot-password', { email })
      setEmailOtp('')
      setOtpError('')
      setResetServerError('')
      setResendCooldown(60)
      setResendMsgIdx(Math.floor(Math.random() * RESEND_MESSAGES.length))
      setResendSuccess(true)
    } catch (err) {
      setResetServerError(err.response?.data?.message || 'Failed to resend OTP.')
    }
  }

  const inputClass = (hasError, shake) =>
    [
      'w-full font-body bg-transparent border rounded-lg px-4 py-3 outline-none',
      'transition-all duration-300 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold',
      inputText,
      hasError ? 'border-red-500' : inputBorder,
      shake ? 'shake-error' : '',
    ].filter(Boolean).join(' ')

  const btnBase = 'w-full font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden'

  return (
    <div
      className={`page-enter min-h-screen flex ${pageBg}`}
      style={{ opacity: leaving ? 0 : 1, transform: leaving ? 'translateY(8px)' : 'translateY(0)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}
    >
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gold flex-col items-center justify-center px-16 gap-10">
        <div className="text-center">
          <h1 className="text-5xl font-heading text-brand-white leading-tight">Khadija</h1>
          <h1 className="text-5xl font-heading text-brand-white leading-tight">Garments</h1>
          <p className="font-body text-brand-white/70 text-sm tracking-widest uppercase mt-3">
            Wholesale &middot; Ladies Bottom Wear
          </p>
        </div>
        <div className="text-5xl font-body text-brand-white/90 select-none transition-all duration-500">
          {FACES[faceIdx]}
        </div>
        <div className="text-center min-h-[3rem] flex flex-col items-center gap-3">
          <p className="font-heading text-brand-white text-2xl transition-all duration-500 text-center max-w-xs">
            {BRAND_MESSAGES[msgIdx]}
          </p>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-brand-white/60 transition-transform duration-200"
                style={{ transform: dotStep === i ? 'translateY(-4px)' : 'translateY(0px)' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          {step === 'email' ? (
            <>
              <div className="text-center mb-10">
                <h1 className={`text-4xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>
                  Forgot Password?
                </h1>
                <p className={`font-body text-sm transition-colors duration-500 ${textColor} opacity-70`}>
                  Enter your email and we'll send you a reset code
                </p>
              </div>

              <form onSubmit={handleSendOtp} noValidate className="flex flex-col gap-1">
                <div className="flex flex-col gap-2">
                  <label className={`font-body font-medium text-sm ${textColor}`}>
                    Email Address <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="text" name="email"
                    placeholder="you@example.com"
                    value={email} onChange={handleEmailChange}
                    className={inputClass(emailError, shakeEmail)}
                  />
                  <p className="h-4 text-red-500 text-xs font-body leading-4">{emailError}</p>
                </div>

                <p className="h-4 text-red-500 text-xs font-body leading-4 mb-2">{serverError}</p>

                <HoverButton
                  type="submit"
                  hoverMessages={SEND_HOVER}
                  loadingMessages={SEND_LOADING}
                  loading={loading}
                  className={`${btnBase} bg-brand-gold text-brand-white`}
                >
                  SEND RESET CODE
                </HoverButton>
              </form>

              <p className={`font-body text-sm text-center mt-8 transition-colors duration-500 ${textColor}`}>
                Remembered it?{' '}
                <button
                  onClick={() => softNavigate('/login')}
                  className="text-brand-gold font-semibold hover:underline transition-all duration-300 active:scale-95 inline-block"
                >
                  Back to login
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">^_^</div>
                <h1 className={`text-3xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>
                  Reset Password
                </h1>
                <p className={`font-body text-sm transition-colors duration-500 ${textColor} opacity-70`}>
                  We sent a 6-digit code to
                </p>
                <p className={`font-body text-sm font-semibold transition-colors duration-500 ${textColor}`}>
                  {maskedEmail}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <OtpInput
                  label="Reset Code"
                  value={emailOtp}
                  onChange={(v) => { setEmailOtp(v); setOtpError('') }}
                  error={otpError}
                  shake={shakeOtp}
                />

                <div className={`flex items-center justify-center gap-2 h-5 w-full transition-all duration-500 ${
                  resendSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                  <span className="text-xs font-body text-brand-gold">^_^</span>
                  <span className={`text-xs font-body font-normal ${textColor}`}>
                    {RESEND_MESSAGES[resendMsgIdx]}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`font-body font-medium text-sm ${textColor}`}>
                    New Password <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="password" name="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 special, 3 numbers"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' }) }}
                    className={inputClass(fieldErrors.password, shakeFields.password)}
                  />
                  <p className="h-4 text-red-500 text-xs font-body leading-4">{fieldErrors.password}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`font-body font-medium text-sm ${textColor}`}>
                    Confirm Password <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="password" name="confirmPassword"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' }) }}
                    className={inputClass(fieldErrors.confirmPassword, shakeFields.confirmPassword)}
                  />
                  <p className="h-4 text-red-500 text-xs font-body leading-4">{fieldErrors.confirmPassword}</p>
                </div>

                <p className="h-4 text-red-500 text-xs font-body leading-4 text-center">{resetServerError}</p>
                {successMsg && (
                  <p className="text-xs font-body text-center text-brand-gold">{successMsg}</p>
                )}

                <HoverButton
                  onClick={handleReset}
                  hoverMessages={RESET_HOVER}
                  loadingMessages={RESET_LOADING}
                  loading={resetLoading}
                  className={`${btnBase} bg-brand-gold text-brand-white`}
                >
                  RESET PASSWORD
                </HoverButton>

                <div className="flex items-center justify-between w-full mt-3">
                  <button
                    onClick={() => {
                      setStep('email')
                      setEmailOtp('')
                      setOtpError('')
                      setResetServerError('')
                      setPassword('')
                      setConfirmPassword('')
                      setFieldErrors({})
                      setResendSuccess(false)
                    }}
                    className={`font-body text-sm hover:underline transition-all duration-300 active:scale-95 ${textColor} opacity-60`}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className={`font-body text-sm text-right w-[7.5rem] shrink-0 transition-all duration-300 active:scale-95 ${
                      resendCooldown > 0
                        ? `${textColor} opacity-40 cursor-not-allowed`
                        : 'text-brand-gold hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? (
                      <>Resend in <span className="inline-block w-[2ch] text-right tabular-nums">{resendCooldown}</span>s</>
                    ) : (
                      'Resend code'
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
