import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
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
const FACES = ['>O<', '^_^', '>W<', '^O^', '-_-']
const LOGIN_HOVER   = ['LOGGING IN! ^_^', "LET'S GO! >O<", 'WELCOME BACK! >W<', 'ALMOST! ^O^']
const LOGIN_LOADING = ['HANG TIGHT >O<', 'CHECKING YOU IN ^_^', 'ALMOST THERE >W<', 'JUST A SEC ^O^']

function Login() {
  const { isDark } = useTheme()
  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/') }, [user, navigate])

  const textColor   = isDark ? 'text-brand-white' : 'text-brand-black'
  const inputBorder = isDark ? 'border-brand-grey' : 'border-brand-lightgrey'
  const inputText   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const pageBg      = isDark ? 'bg-brand-black'    : 'bg-brand-white'

  const [formData, setFormData]       = useState({ email: '', password: '' })
  const [errors, setErrors]           = useState({})
  const [shakeFields, setShakeFields] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [msgIdx,  setMsgIdx]          = useState(0)
  const [faceIdx, setFaceIdx]         = useState(0)
  const [dotStep, setDotStep]         = useState(0)
  const [leaving, setLeaving]         = useState(false)

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

  const softNavigate = (path) => {
    setLeaving(true)
    setTimeout(() => navigate(path), 350)
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
      const { data } = await api.post('/auth/login', formData)
      login(data)
      navigate('/')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.')
      setShakeFields({ email: true, password: true })
      setTimeout(() => setShakeFields({}), 400)
    } finally {
      setLoading(false)
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

  return (
    <div
      className={`page-enter min-h-screen flex ${pageBg}`}
      style={{ opacity: leaving ? 0 : 1, transform: leaving ? 'translateY(10px)' : 'translateY(0)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}
    >
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gold flex-col items-center justify-center px-16 gap-8">
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
        <button
          onClick={() => softNavigate('/admin/login')}
          className="font-body text-xs text-brand-white/50 hover:text-brand-white border border-brand-white/20 hover:border-brand-white/50 rounded-full px-4 py-1.5 transition-all duration-300 active:scale-95 tracking-widest uppercase"
        >
          Admin Portal
        </button>
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
          <div className="text-center mb-10">
            <h1 className={`text-4xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>
              Welcome Back
            </h1>
            <p className={`font-body text-sm transition-colors duration-500 ${textColor}`}>
              Log in to your Khadija Garments account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
            <div className="flex flex-col gap-2">
              <label className={`font-body font-medium text-sm ${textColor}`}>
                Email Address <span className="text-brand-gold">*</span>
              </label>
              <input
                type="text" name="email"
                placeholder="you@example.com"
                value={formData.email} onChange={handleEmail}
                className={inputClass('email')}
              />
              <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.email}</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className={`font-body font-medium text-sm ${textColor}`}>
                Password <span className="text-brand-gold">*</span>
              </label>
              <input
                type="password" name="password"
                placeholder="Enter your password"
                value={formData.password} onChange={handlePassword}
                className={inputClass('password')}
              />
              <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.password}</p>
            </div>

            <p className="h-4 text-red-500 text-xs font-body leading-4 mb-2">{serverError}</p>

            <HoverButton
              type="submit"
              hoverMessages={LOGIN_HOVER}
              loadingMessages={LOGIN_LOADING}
              loading={loading}
              className="w-full bg-brand-gold text-brand-white font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden"
            >
              LOG IN
            </HoverButton>
          </form>

          <p className={`font-body text-sm text-center mt-8 transition-colors duration-500 ${textColor}`}>
            New here?{' '}
            <button
              onClick={() => softNavigate('/signup')}
              className="text-brand-gold font-semibold hover:underline transition-all duration-300 active:scale-95 inline-block"
            >
              Create an account
            </button>
          </p>

          <div className="lg:hidden flex justify-center mt-6">
            <button
              onClick={() => softNavigate('/admin/login')}
              className={`font-body text-xs tracking-widest uppercase border rounded-full px-4 py-1.5 transition-all duration-300 active:scale-95 opacity-40 hover:opacity-100
                ${isDark
                  ? 'border-brand-white text-brand-white'
                  : 'border-brand-black text-brand-black'
                }`}
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
