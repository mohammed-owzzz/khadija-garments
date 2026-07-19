import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import PlayfulMessage from '../components/PlayfulMessage'
import HoverButton from '../components/HoverButton'
import PlayfulLoader from '../components/PlayfulLoader'
import Reveal from '../components/Reveal'
import { scrollToFirstError } from '../utils/formScroll'
import api from '../api/axios'

const SEND_HOVER    = ['SEND IT! ^_^', "LET'S GO! >O<", 'ALL EARS! >W<', 'HIT SEND! ^O^']
const SEND_LOADING  = ['SENDING >O<', 'ON ITS WAY ^_^', 'JUST A SEC >W<', 'ALMOST! ^O^']
const BUSINESS_EMAIL = 'kgarments.sales@gmail.com'

function Contact() {
  const { isDark } = useTheme()
  const textColor   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const inputBorder = isDark ? 'border-brand-grey'  : 'border-brand-lightgrey'
  const inputText   = isDark ? 'text-brand-white'   : 'text-brand-black'

  const [pageLoading, setPageLoading] = useState(true)
  const [formData, setFormData]       = useState({ name: '', email: '', message: '' })
  const [errors, setErrors]           = useState({})
  const [shakeFields, setShakeFields] = useState({})
  const [submitted, setSubmitted]     = useState(false)
  const [serverError, setServerError] = useState('')
  const [sending, setSending]         = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

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
  const handleMessage = (e) => {
    setFormData({ ...formData, message: e.target.value })
    if (errors.message) setErrors({ ...errors, message: '' })
    if (serverError) setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim())    e.name    = 'Name is required'
    if (!formData.email.trim()) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = 'Please enter a valid email address'
    }
    if (!formData.message.trim()) e.message = 'Message is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setShakeFields(validationErrors)
      scrollToFirstError(validationErrors, { order: ['name', 'email', 'message'] })
      setTimeout(() => setShakeFields({}), 400)
      return
    }
    setSending(true)
    setServerError('')
    try {
      await api.post('/contact', {
        name:    formData.name,
        email:   formData.email,
        message: formData.message,
      })
      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      setErrors({})
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to send. Please try again.')
    } finally {
      setSending(false)
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

  if (pageLoading) return <PlayfulLoader variant="customer" />

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-24">
      <Reveal as="h1" className={`text-5xl font-heading mb-4 transition-colors duration-500 ${textColor}`}>
        Contact Us
      </Reveal>
      <Reveal as="p" delay={80} className={`font-body font-light mb-12 transition-colors duration-500 ${textColor}`}>
        Have a question? We would love to hear from you.
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">

          <div className="h-10 mb-2">
            <PlayfulMessage show={submitted} variant="contact" size="lg" />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`font-body font-medium text-sm transition-colors duration-500 ${textColor}`}>
              Your Name <span className="text-brand-gold">*</span>
            </label>
            <input type="text" name="name" placeholder="Full Name"
              value={formData.name} onChange={handleName} className={inputClass('name')} />
            <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.name}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`font-body font-medium text-sm transition-colors duration-500 ${textColor}`}>
              Email Address <span className="text-brand-gold">*</span>
            </label>
            <input type="text" name="email" placeholder="you@example.com"
              value={formData.email} onChange={handleEmail} className={inputClass('email')} />
            <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.email}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`font-body font-medium text-sm transition-colors duration-500 ${textColor}`}>
              Message <span className="text-brand-gold">*</span>
            </label>
            <textarea name="message" rows={5} placeholder="How can we help?"
              value={formData.message} onChange={handleMessage}
              className={`resize-none ${inputClass('message')}`} />
            <p className="h-4 text-red-500 text-xs font-body leading-4">{errors.message}</p>
          </div>

          <p className="h-4 text-red-500 text-xs font-body leading-4">{serverError}</p>

          <div className="mt-2">
            <HoverButton
              type="submit"
              hoverMessages={SEND_HOVER}
              loadingMessages={SEND_LOADING}
              loading={sending}
              className="w-48 bg-brand-gold text-brand-white font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden"
            >
              SEND MESSAGE
            </HoverButton>
          </div>
        </form>

        <div className={`flex flex-col gap-8 font-body transition-colors duration-500 ${textColor}`}>
          <div>
            <h3 className="text-brand-gold text-xs font-bold tracking-widest mb-2 uppercase">CEO</h3>
            <p>Shaikh Feroz Hussain</p>
          </div>
          <div>
            <h3 className="text-brand-gold text-xs font-bold tracking-widest mb-2 uppercase">Email</h3>
            <a href={`mailto:${BUSINESS_EMAIL}`} className="break-all inline-block hover:text-brand-gold transition-all duration-300 active:scale-95">
              {BUSINESS_EMAIL}
            </a>
          </div>
          <div>
            <h3 className="text-brand-gold text-xs font-bold tracking-widest mb-2 uppercase">Phone</h3>
            <a href="tel:+919082758821" className="inline-block hover:text-brand-gold transition-all duration-300 active:scale-95">
              +91 90827 58821
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact