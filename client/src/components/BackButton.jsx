import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const HIDE_ON = ['/']

function BackButton() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isDark } = useTheme()

  if (HIDE_ON.includes(pathname)) return null

  const textColor = isDark ? 'text-brand-white' : 'text-brand-black'

  return (
    <button
      onClick={() => navigate(-1)}
      className={`group flex items-center gap-1 font-body text-sm font-medium transition-all duration-300 hover:text-brand-gold hover:-translate-x-0.5 active:scale-95 ${textColor}`}
    >
      <ChevronLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
      Back
    </button>
  )
}

export default BackButton