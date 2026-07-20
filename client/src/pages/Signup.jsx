import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import OtpInput from '../components/OtpInput'
import HoverButton from '../components/HoverButton'
import { scrollToFirstError } from '../utils/formScroll'
import api from '../api/axios'

const BRAND_MESSAGES = [
  'HUNDREDS OF RETAILERS.',
  'WHOLESALE FROM DAY ONE.',
  'NEW SEASONAL DESIGNS.',
  'WE GROW TOGETHER.',
  'QUALITY YOU CAN FEEL.',
]
const RESEND_MESSAGES = [
  'FRESH OTP ON ITS WAY! ^_^',
  'NEW CODE SENT! CHECK YOUR INBOX >O<',
  'OTP RESENT! YOU GOT THIS >W<',
  'CHECK YOUR EMAIL — NEW CODE INCOMING! ^O^',
]
const FACES = ['>O<', '^_^', '>W<', '^O^', '-_-']
const CONTINUE_HOVER   = ["LET'S GO! ^_^", 'ALMOST! >O<', 'ONE MORE STEP! >W<', 'READY! ^O^']
const CONTINUE_LOADING = ['SENDING YOUR CODE >O<', 'WARMING UP THE INBOX ^_^', 'ALMOST READY >W<', 'HANG TIGHT ^O^']
const VERIFY_HOVER     = ['VERIFY ME! ^_^', "LET'S DO IT! >O<", 'ALMOST IN! >W<', 'CONFIRM! ^O^']
const VERIFY_LOADING   = ['VERIFYING >O<', 'HANG TIGHT ^_^', 'CHECKING THE CODE >W<', 'ALMOST IN ^O^']

function Signup() {
  const { isDark } = useTheme()
  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/') }, [user, navigate])

  const textColor   = isDark ? 'text-brand-white' : 'text-brand-black'
  const inputBorder = isDark ? 'border-brand-grey' : 'border-brand-lightgrey'
  const inputText   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const pageBg      = isDark ? 'bg-brand-black'    : 'bg-brand-white'

  const [step, setStep] = useState('form')
  const [formData, setFormData]       = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors]           = useState({})
  const [shakeFields, setShakeFields] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)

  const [emailOtp, setEmailOtp]             = useState('')
  const [otpError, setOtpError]             = useState('')
  const [shakeOtp, setShakeOtp]             = useState(false)
  const [otpServerError, setOtpServerError] = useState('')
  const [maskedEmail, setMaskedEmail]       = useState('')
  const [otpLoading, setOtpLoading]         = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess]   = useState(false)
  const [resendMsgIdx, setResendMsgIdx]     = useState(0)

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

  const handleName = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '')
    setFormData({ ...formData, name: cleaned })
    if (errors.name) setErrors({ ...errors, name: '' })
    if (serverError) setServerError('')
  }
  const handleEmail = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9@._+\-]/g, '')
    setFormData({ ...formData, email: cleaned })
    if (errors.email) setErrors({ ...errors, email: '' })
    if (serverError) setServerError('')
  }
  const handlePhone = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setFormData({ ...formData, phone: digits })
    if (errors.phone) setErrors({ ...errors, phone: '' })
    if (serverError) setServerError('')
  }
  const handlePassword = (e) => {
    setFormData({ ...formData, password: e.target.value })
    if (errors.password) setErrors({ ...errors, password: '' })
    if (serverError) setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Full name is required'
    if (!formData.email.trim()) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = 'Please enter a valid email address'
    }
    if (formData.phone && formData.phone.length !== 10)
      e.phone = 'Must be a valid 10-digit number'
    if (!formData.password.trim()) {
      e.password = 'Password is required'
    } else if (formData.password.length < 8) {
      e.password = 'Minimum 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      e.password = 'Must include at least one uppercase letter'
    } else if (!/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/.test(formData.password)) {
      e.password = 'Must include at least one special character'
    } else if ((formData.password.match(/\d/g) || []).length < 3) {
      e.password = 'Must include at least 3 numbers'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setShakeFields(validationErrors)
      scrollToFirstError(validationErrors, { order: ['name', 'email', 'phone', 'password'] })
      setTimeout(() => setShakeFields({}), 400)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/send-register-otp', formData)
      setMaskedEmail(data.maskedEmail)
      setStep('otp')
      setResendCooldown(60)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
      setShakeFields({ email: true })
      setTimeout(() => setShakeFields({}), 400)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (emailOtp.replace(/\s/g, '').length !== 6) {
      setOtpError('Enter the 6-digit OTP')
      triggerOtpShake()
      return
    }
    setOtpLoading(true)
    setOtpServerError('')
    try {
      const { data } = await api.post('/auth/verify-register', {
        email: formData.email,
        emailOtp,
      })
      login(data)
      navigate('/')
    } catch (err) {
      setOtpServerError(err.response?.data?.message || 'Verification failed.')
      triggerOtpShake()
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/resend-otp', { email: formData.email })
      setEmailOtp('')
      setOtpError('')
      setOtpServerError('')
      setResendCooldown(60)
      setResendMsgIdx(Math.floor(Math.random() * RESEND_MESSAGES.length))
      setResendSuccess(true)
    } catch (err) {
      setOtpServerError(err.response?.data?.message || 'Failed to resend OTP.')
    }
  }

  const inputClass = (field) =>
    [
      'w-full font-body bg-transparent border rounded-lg px-4 py-3 outline-none',
      'transition-all duration-300 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold',
      inputText,
      errors[field] ? 'border-red-500' : inputBorder,
      shakeFields[field] ? 'shake-error' : '',
    ].filter(Boolean).join(' ')

  const btnBase = 'w-full font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden'

  return (
    <div
      className={`page-enter min-h-screen flex transition-all duration-350 ${pageBg}`}
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
          {step === 'form' ? (
            <>
              <div className="text-center mb-10">
                <h1 className={`text-4xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>
                  Create Account
                </h1>
                <p className={`font-body text-sm transition-colors duration-500 ${textColor}`}>
                  Join Khadija Garments
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
                <div className="flex flex-col gap-2">
                  <label className={`font-body font-medium text-sm ${textColor}`}>
                    Full Name <span className="text-brand-gold">*</span>
                  </label>
                  <input type="text" name="name" placeholder="Your name"
                    value={formData.name} onChange={handleName} className={inputClass('name')} />
                  <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.name}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`font-body font-medium text-sm ${textColor}`}>
                    Email Address <span className="text-brand-gold">*</span>
                  </label>
                  <input type="text" name="email" placeholder="you@example.com"
                    value={formData.email} onChange={handleEmail} className={inputClass('email')} />
                  <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.email}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`font-body font-medium text-sm ${textColor}`}>
                    Phone Number
                    <span className={`font-normal text-xs ml-2 opacity-50 ${textColor}`}>(optional)</span>
                  </label>
                  <input type="text" inputMode="numeric" name="phone"
                    placeholder="10-digit mobile number"
                    value={formData.phone} onChange={handlePhone} className={inputClass('phone')} />
                  <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.phone}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`font-body font-medium text-sm ${textColor}`}>
                    Password <span className="text-brand-gold">*</span>
                  </label>
                  <input type="password" name="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 special, 3 numbers"
                    value={formData.password} onChange={handlePassword} className={inputClass('password')} />
                  <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.password}</p>
                </div>

                <p className="h-4 text-red-500 text-xs font-body leading-4 mb-2">{serverError}</p>

                <HoverButton
                  type="submit"
                  hoverMessages={CONTINUE_HOVER}
                  loadingMessages={CONTINUE_LOADING}
                  loading={loading}
                  className={`${btnBase} bg-brand-gold text-brand-white`}
                >
                  CONTINUE
                </HoverButton>
              </form>

              <p className={`font-body text-sm text-center mt-8 transition-colors duration-500 ${textColor}`}>
                Already have an account?{' '}
                <button
                  onClick={() => softNavigate('/login')}
                  className="text-brand-gold font-semibold hover:underline transition-all duration-300 active:scale-95 inline-block"
                >
                  Log in
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">^_^</div>
                <h1 className={`text-3xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>
                  Almost There!
                </h1>
                <p className={`font-body text-sm transition-colors duration-500 ${textColor} opacity-70`}>
                  We sent a 6-digit code to
                </p>
                <p className={`font-body text-sm font-semibold transition-colors duration-500 ${textColor}`}>
                  {maskedEmail}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-full">
                  <OtpInput
                    label="Email OTP"
                    value={emailOtp}
                    onChange={(v) => { setEmailOtp(v); setOtpError('') }}
                    error={otpError}
                    shake={shakeOtp}
                  />
                </div>

                <div className={`flex items-center justify-center gap-2 h-5 w-full transition-all duration-500 ${
                  resendSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                  <span className="text-xs font-body text-brand-gold">^_^</span>
                  <span className={`text-xs font-body font-normal ${textColor}`}>
                    {RESEND_MESSAGES[resendMsgIdx]}
                  </span>
                </div>

                <p className="h-4 text-red-500 text-xs font-body leading-4 text-center">
                  {otpServerError}
                </p>

                <HoverButton
                  onClick={handleVerifyOtp}
                  hoverMessages={VERIFY_HOVER}
                  loadingMessages={VERIFY_LOADING}
                  loading={otpLoading}
                  className={`${btnBase} bg-brand-gold text-brand-white`}
                >
                  VERIFY &amp; CREATE ACCOUNT
                </HoverButton>

                <div className="flex items-center justify-between w-full mt-3">
                  <button
                    onClick={() => {
                      setStep('form')
                      setEmailOtp('')
                      setOtpError('')
                      setOtpServerError('')
                      setResendSuccess(false)
                    }}
                    className={`font-body text-sm hover:underline transition-all duration-300 active:scale-95 ${textColor} opacity-60`}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className={`font-body text-sm text-right tabular-nums min-w-[7.5rem] transition-all duration-300 active:scale-95 ${
                      resendCooldown > 0
                        ? `${textColor} opacity-40 cursor-not-allowed`
                        : 'text-brand-gold hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend in ${String(resendCooldown).padStart(2, '0')}s` : 'Resend OTP'}
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

export default Signup
