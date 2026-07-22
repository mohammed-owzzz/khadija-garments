import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import OtpInput from '../../components/OtpInput'
import HoverButton from '../../components/HoverButton'
import { scrollToFirstError } from '../../utils/formScroll'
import api from '../../api/axios'

const ADMIN_HOVER    = ['CONTINUE! ^_^', "LET'S GO! >O<", 'VERIFYING! >W<', 'ALMOST! ^O^']
const ADMIN_LOADING  = ['HANG TIGHT >O<', 'CHECKING CREDENTIALS ^_^', 'SENDING YOUR CODE >W<', 'ALMOST THERE ^O^']
const VERIFY_HOVER   = ['VERIFY! ^_^', "LET'S GO! >O<", 'ALMOST IN! >W<', 'CONFIRM! ^O^']
const VERIFY_LOADING = ['VERIFYING >O<', 'CHECKING CODE ^_^', 'ALMOST IN >W<', 'HANG TIGHT ^O^']
const RESEND_MESSAGES = [
  'FRESH CODE ON ITS WAY! ^_^',
  'NEW CODE SENT! >O<',
  'CODE RESENT! YOU GOT THIS >W<',
  'CHECK THE INBOX! ^O^',
]

function AdminLogin() {
  const navigate = useNavigate()

  const [step, setStep] = useState('credentials')

  // Step 1 — credentials
  const [formData, setFormData]       = useState({ email: '', password: '' })
  const [errors, setErrors]           = useState({})
  const [shakeFields, setShakeFields] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [leaving, setLeaving]         = useState(false)

  // Step 2 — OTP
  const [maskedEmail, setMaskedEmail]       = useState('')
  const [emailOtp, setEmailOtp]             = useState('')
  const [otpError, setOtpError]             = useState('')
  const [shakeOtp, setShakeOtp]             = useState(false)
  const [otpServerError, setOtpServerError] = useState('')
  const [verifying, setVerifying]           = useState(false)
  const [successMsg, setSuccessMsg]         = useState('')

  // Resend
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess]   = useState(false)
  const [resendMsgIdx, setResendMsgIdx]     = useState(0)

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

  const handleEmail = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9@._+\-]/g, '')
    setFormData({ ...formData, email: cleaned })
    if (errors.email) setErrors({ ...errors, email: '' })
    if (serverError) setServerError('')
  }
  const handlePassword = (e) => {
    setFormData({ ...formData, password: e.target.value })
    if (errors.password) setErrors({ ...errors, password: '' })
    if (serverError) setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!formData.email.trim()) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = 'Please enter a valid email address'
    }
    if (!formData.password.trim()) e.password = 'Password is required'
    return e
  }

  // Step 1: verify the password — the server then emails a 6-digit code
  // to the secured admin inbox before any access is granted.
  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setShakeFields(validationErrors)
      scrollToFirstError(validationErrors, { order: ['email', 'password'] })
      setTimeout(() => setShakeFields({}), 400)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/admin-login', formData)
      setMaskedEmail(data.maskedEmail || '')
      setStep('otp')
      setResendCooldown(60)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.')
      setShakeFields({ email: true, password: true })
      setTimeout(() => setShakeFields({}), 400)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: verify the emailed code — only now is the admin token issued.
  const handleVerify = async () => {
    if (emailOtp.replace(/\s/g, '').length !== 6) {
      setOtpError('Enter the 6-digit code')
      triggerOtpShake()
      return
    }
    setVerifying(true)
    setOtpServerError('')
    try {
      const { data } = await api.post('/auth/verify-admin-login', {
        email: formData.email,
        emailOtp,
      })
      localStorage.setItem('khadija_admin', JSON.stringify(data))
      setSuccessMsg('Verified! Entering dashboard\u2026')
      setTimeout(() => navigate('/admin/dashboard'), 900)
    } catch (err) {
      setOtpServerError(err.response?.data?.message || 'Verification failed. Please try again.')
      triggerOtpShake()
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/resend-admin-otp', { email: formData.email })
      setEmailOtp('')
      setOtpError('')
      setOtpServerError('')
      setResendCooldown(60)
      setResendMsgIdx(Math.floor(Math.random() * RESEND_MESSAGES.length))
      setResendSuccess(true)
    } catch (err) {
      setOtpServerError(err.response?.data?.message || 'Failed to resend code.')
    }
  }

  const inputClass = (field) =>
    [
      'w-full font-body bg-transparent border rounded-lg px-4 py-3 outline-none text-brand-black',
      'transition-all duration-300 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold',
      errors[field] ? 'border-red-500' : 'border-brand-lightgrey',
      shakeFields[field] ? 'shake-error' : '',
    ].filter(Boolean).join(' ')

  return (
    <div
      className="page-enter min-h-screen bg-brand-white flex items-center justify-center px-6"
      style={{ opacity: leaving ? 0 : 1, transform: leaving ? 'translateY(8px)' : 'translateY(0)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}
    >
      <div key={step} className="w-full max-w-sm animate-fade-up">

        {step === 'credentials' ? (
          <>
            <button
              onClick={() => softNavigate('/login')}
              className="flex items-center gap-1.5 font-body text-sm text-brand-black/40 hover:text-brand-black transition-all duration-300 active:scale-95 mb-10 w-fit"
            >
              <span className="text-base leading-none">←</span>
              <span>Back to Login</span>
            </button>

            <div className="text-center mb-10">
              <h1 className="text-4xl font-heading text-brand-black mb-1">Khadija Garments</h1>
              <p className="font-body text-brand-black text-xs tracking-widest uppercase opacity-40">Admin Portal</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
              <div className="flex flex-col gap-2">
                <label className="font-body font-medium text-sm text-brand-black">Email</label>
                <input type="text" name="email"
                  placeholder="admin@khadijagarments.com"
                  value={formData.email} onChange={handleEmail}
                  className={inputClass('email')} />
                <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.email}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body font-medium text-sm text-brand-black">Password</label>
                <input type="password" name="password"
                  placeholder="Enter admin password"
                  value={formData.password} onChange={handlePassword}
                  className={inputClass('password')} />
                <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.password}</p>
              </div>

              <p className="h-4 text-red-500 text-xs font-body leading-4 mb-2">{serverError}</p>

              <HoverButton
                type="submit"
                hoverMessages={ADMIN_HOVER}
                loadingMessages={ADMIN_LOADING}
                loading={loading}
                className="w-full bg-brand-gold text-brand-white font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden"
              >
                CONTINUE
              </HoverButton>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setStep('credentials')
                setEmailOtp('')
                setOtpError('')
                setOtpServerError('')
                setSuccessMsg('')
                setResendSuccess(false)
                setFormData({ ...formData, password: '' })
              }}
              className="flex items-center gap-1.5 font-body text-sm text-brand-black/40 hover:text-brand-black transition-all duration-300 active:scale-95 mb-10 w-fit"
            >
              <span className="text-base leading-none">←</span>
              <span>Back</span>
            </button>

            <div className="text-center mb-8">
              <div className="text-4xl mb-3">^_^</div>
              <h1 className="text-3xl font-heading text-brand-black mb-2">Verify It's You</h1>
              <p className="font-body text-sm text-brand-black opacity-70">
                For extra security, we sent a 6-digit code to
              </p>
              <p className="font-body text-sm font-semibold text-brand-black">
                {maskedEmail}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <OtpInput
                label="Admin Login Code"
                value={emailOtp}
                onChange={(v) => { setEmailOtp(v); setOtpError(''); setOtpServerError('') }}
                error={otpError}
                shake={shakeOtp}
              />

              <div className={`flex items-center justify-center gap-2 h-5 w-full transition-all duration-500 ${
                resendSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <span className="text-xs font-body text-brand-gold">^_^</span>
                <span className="text-xs font-body font-normal text-brand-black">
                  {RESEND_MESSAGES[resendMsgIdx]}
                </span>
              </div>

              <p className="h-4 text-xs font-body leading-4 text-center">
                {otpServerError ? (
                  <span className="text-red-500">{otpServerError}</span>
                ) : successMsg ? (
                  <span className="text-brand-gold">{successMsg}</span>
                ) : null}
              </p>

              <HoverButton
                onClick={handleVerify}
                hoverMessages={VERIFY_HOVER}
                loadingMessages={VERIFY_LOADING}
                loading={verifying}
                className="w-full bg-brand-gold text-brand-white font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden"
              >
                VERIFY & ENTER
              </HoverButton>

              <div className="flex items-center justify-end w-full mt-3">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`font-body text-sm text-right w-[7.5rem] shrink-0 transition-all duration-300 active:scale-95 ${
                    resendCooldown > 0
                      ? 'text-brand-black opacity-40 cursor-not-allowed'
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
  )
}

export default AdminLogin
