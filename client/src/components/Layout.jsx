import Navbar from './Navbar'
import Footer from './Footer'
import ThemeBackground from './ThemeBackground'
import BackButton from './BackButton'
import PageTransition from './PageTransition'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const HIDE_BACK_ON = ['/']

function Layout({ children }) {
  const { pathname } = useLocation()
  const { isDark } = useTheme()
  const showBack = !HIDE_BACK_ON.includes(pathname)

  const borderColor = isDark ? 'border-brand-grey' : 'border-brand-lightgrey'

  return (
    <div className="min-h-screen flex flex-col relative">
      <ThemeBackground />
      <Navbar />
      {showBack && (
        <div className={`px-6 md:px-8 py-3 border-b transition-colors duration-500 ${borderColor}`}>
          <BackButton />
        </div>
      )}
      <div className="flex-1">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
      <Footer />
    </div>
  )
}

export default Layout