import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HoverButton from '../../components/HoverButton'
import { scrollToFirstError } from '../../utils/formScroll'
import api from '../../api/axios'

const ADMIN_HOVER   = ['LOGGING IN! ^_^', "LET'S GO! >O<", 'VERIFYING! >W<', 'ALMOST! ^O^']
const ADMIN_LOADING = ['HANG TIGHT >O<', 'VERIFYING ADMIN ^_^', 'CHECKING CREDENTIALS >W<', 'ALMOST IN ^O^']

function AdminLogin() {
  const navigate = useNavigate()

  const [formData, setFormData]       = useState({ email: '', password: '' })
  const [errors, setErrors]           = useState({})
  const [shakeFields, setShakeFields] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [leaving, setLeaving]         = useState(false)

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
      const { data } = await api.post('/auth/admin-login', formData)
      localStorage.setItem('khadija_admin', JSON.stringify(data))
      navigate('/admin/dashboard')
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
      <div className="w-full max-w-sm">

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
            LOG IN
          </HoverButton>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin