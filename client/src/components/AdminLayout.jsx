import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import HoverButton from './HoverButton'

const LOGOUT_HOVER = ['LOG OUT! ^_^', 'BYE BYE! >O<', 'SEE YA! >W<', 'ADIOS! ^O^']
const LOGOUT_CLICK = ['LOGGING OUT >O<', 'SEE YOU SOON ^_^', 'BYE BYE >W<', 'SIGNING OFF ^O^']

function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  const navItems = [
    { label: 'Dashboard',  path: '/admin/dashboard' },
    { label: 'Orders',     path: '/admin/orders' },
    { label: 'Products',   path: '/admin/products' },
    { label: 'Categories', path: '/admin/categories' },
    { label: 'Customers',  path: '/admin/customers' },
  ]

  const handleLogout = () => {
    setLoggingOut(true)
    setTimeout(() => navigate('/admin/login'), 1000)
  }
  const handleNavClick = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen flex bg-brand-white">

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-5 left-5 z-50 bg-brand-white border-2 border-brand-black text-brand-black rounded-lg p-2 hover:bg-brand-black hover:text-brand-white transition-all duration-300 ease-out active:scale-90 shadow-sm"
        >
          <Menu size={22} />
        </button>
      )}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-brand-black/60 z-40"
        />
      )}

      <aside
        className={`fixed w-64 bg-brand-black flex flex-col justify-between py-8 px-6 flex-shrink-0 top-0 left-0 h-screen z-50 transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-heading text-brand-white mb-1">
                Khadija Garments
              </h1>
              <p className="font-body text-brand-white text-xs tracking-widest uppercase">
                Admin Portal
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-brand-white transition-all duration-300 hover:text-brand-gold hover:scale-110 active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`font-body text-sm font-medium px-4 py-3 rounded-lg transition-all duration-300 active:scale-95 ${
                  location.pathname === item.path
                    ? 'bg-brand-gold text-brand-white'
                    : 'text-brand-white hover:bg-brand-grey'
                }`}
              >
                {item.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>

        <HoverButton
          hoverMessages={LOGOUT_HOVER}
          clickMessages={LOGOUT_CLICK}
          loading={loggingOut}
          onClick={handleLogout}
          className="w-full font-body font-semibold text-sm tracking-widest uppercase border-2 border-brand-white/25 text-brand-white rounded-lg px-4 py-3 hover:bg-brand-white hover:text-brand-black hover:border-brand-white transition-all duration-300 active:scale-95 disabled:opacity-70"
        >
          <LogOut size={15} />
          LOG OUT
        </HoverButton>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-64 p-6 lg:p-10 pt-16 lg:pt-10 page-enter">
        {children}
      </main>
    </div>
  )
}

export default AdminLayout