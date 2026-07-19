import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import ButtonLoader from '../components/ButtonLoader'

const LOGOUT_HOVER   = ['SEE YOU! ^_^', 'BYE BYE! >o<', 'TAKE CARE! >w<', 'ADIOS! ^o^']
const LOGOUT_LOADING = ['see ya! >o<', 'see you ^_^', 'bye! >w<', 'take care ^o^']

function LogoutButton({ onLogout, loading, isDark, mobile = false }) {
  const [hover, setHover] = useState(false)
  const [idx, setIdx]     = useState(0)
  const interval          = useRef(null)

  const handleEnter = () => {
    if (loading || hover) return
    setHover(true); setIdx(0)
    interval.current = setInterval(
      () => setIdx((i) => (i + 1) % LOGOUT_HOVER.length), 1100
    )
  }
  const handleLeave = () => {
    setHover(false)
    clearInterval(interval.current)
  }

  return (
    <button
      onClick={onLogout}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      disabled={loading}
      className={`font-body font-semibold text-sm rounded-lg border-2 transition-all duration-300 ease-out active:scale-95 overflow-hidden disabled:opacity-90
        ${mobile ? 'block text-center w-full px-4 py-2.5' : 'w-44 px-5 py-2'}
        ${isDark
          ? 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
          : 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
        }`}
    >
      {loading
        ? <ButtonLoader messages={LOGOUT_LOADING} />
        : hover
        ? LOGOUT_HOVER[idx]
        : 'LOG OUT'}
    </button>
  )
}

function Navbar() {
  const { isDark }       = useTheme()
  const { cartCount }    = useCart()
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [menuOpen, setMenuOpen]           = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const textColor   = isDark ? 'text-brand-black' : 'text-brand-white'
  const bgColor     = isDark ? 'bg-brand-white'   : 'bg-brand-black'
  const borderColor = isDark ? 'border-brand-lightgrey' : 'border-brand-grey'
  const firstName   = user?.name?.split(' ')[0] || ''

  const handleLogout = () => {
    setLogoutLoading(true)
    setMenuOpen(false)
    setTimeout(() => {
      logout()
      setLogoutLoading(false)
      navigate('/')
    }, 1200)
  }

  return (
    <nav className={`slide-down w-full border-b px-6 md:px-8 py-5 sticky top-0 z-50 transition-colors duration-500 ${bgColor} ${borderColor}`}>

      {/* ── Desktop ── */}
      <div className="hidden lg:flex items-center justify-between">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-10">
          <Link to="/" className={`text-2xl md:text-3xl font-heading transition-colors duration-500 inline-block hover:scale-105 hover:text-brand-gold ${textColor}`}>
            Khadija Garments
          </Link>

          <div className={`flex items-center gap-6 font-body text-sm font-medium transition-colors duration-500 ${textColor}`}>
            <Link to="/"            className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">HOME</Link>
            <Link to="/catalogue"   className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">CATALOGUE</Link>
            <Link to="/about"       className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">ABOUT</Link>
            <Link to="/contact"     className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">CONTACT</Link>
            <Link to="/track-order" className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95 whitespace-nowrap">TRACK ORDER</Link>
            <Link to="/cancel-order" className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95 whitespace-nowrap">CANCEL ORDER</Link>
          </div>
        </div>

        {/* Middle: cart */}
        <Link to="/cart" className={`font-body font-medium text-sm whitespace-nowrap transition-colors duration-500 ${textColor} hover:text-brand-gold`}>
          CART (<span key={cartCount} className="inline-block animate-pop">{cartCount}</span>)
        </Link>

        {/* Right: account */}
        <div className="flex items-center justify-end gap-3">
          {user ? (
            <>
              <span className={`font-heading text-2xl whitespace-nowrap transition-colors duration-500 ${textColor} mr-2`}>
                Hi, {firstName}
              </span>
              <LogoutButton onLogout={handleLogout} loading={logoutLoading} isDark={isDark} />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`font-body font-semibold px-5 py-2 text-sm rounded-lg border-2 transition-all duration-300 ease-out active:scale-95 ${
                  isDark
                    ? 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                    : 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                }`}
              >
                LOGIN
              </Link>
              <Link
                to="/signup"
                className="font-body font-semibold px-5 py-2 text-sm rounded-lg bg-brand-gold text-brand-white hover:opacity-90 transition-all duration-300 ease-out active:scale-95"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile top bar ── */}
      <div className="flex lg:hidden items-center justify-between">
        <Link to="/" onClick={() => setMenuOpen(false)} className={`text-2xl font-heading transition-colors duration-500 ${textColor}`}>
          Khadija Garments
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} className={`transition-all duration-300 hover:text-brand-gold hover:scale-110 active:scale-90 ${textColor}`}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="menu-in lg:hidden grid grid-cols-2 gap-8 mt-6 pb-2">
          <div className={`flex flex-col gap-5 font-body text-sm font-medium transition-colors duration-500 ${textColor}`}>
            <Link to="/"            onClick={() => setMenuOpen(false)} className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">HOME</Link>
            <Link to="/catalogue"   onClick={() => setMenuOpen(false)} className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">CATALOGUE</Link>
            <Link to="/about"       onClick={() => setMenuOpen(false)} className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">ABOUT</Link>
            <Link to="/contact"     onClick={() => setMenuOpen(false)} className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">CONTACT</Link>
            <Link to="/track-order" onClick={() => setMenuOpen(false)} className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">TRACK ORDER</Link>
            <Link to="/cancel-order" onClick={() => setMenuOpen(false)} className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">CANCEL ORDER</Link>
            <Link to="/cart"        onClick={() => setMenuOpen(false)} className="link-underline hover:text-brand-gold transition-all duration-300 active:scale-95">CART (<span key={cartCount} className="inline-block animate-pop">{cartCount}</span>)</Link>
          </div>

          <div className="flex flex-col justify-center gap-4">
            {user ? (
              <div>
                <p className={`font-heading text-2xl text-center mb-3 transition-colors duration-500 ${textColor}`}>
                  Hi, {firstName}
                </p>
                <LogoutButton onLogout={handleLogout} loading={logoutLoading} isDark={isDark} mobile />
              </div>
            ) : (
              <>
                <div>
                  <p className={`font-body text-xs mb-2 transition-colors duration-500 ${textColor}`}>Already a customer?</p>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className={`block text-center w-full font-body font-semibold px-4 py-2.5 text-sm rounded-lg border-2 transition-all duration-300 ease-out active:scale-95 ${
                      isDark
                        ? 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                        : 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                    }`}
                  >
                    LOG IN
                  </Link>
                </div>
                <div>
                  <p className={`font-body text-xs mb-2 transition-colors duration-500 ${textColor}`}>New here?</p>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center w-full font-body font-semibold px-4 py-2.5 text-sm rounded-lg bg-brand-gold text-brand-white hover:opacity-90 transition-all duration-300 ease-out active:scale-95"
                  >
                    SIGN UP
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar