import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Button from '../components/Button'

function NotFound() {
  const { isDark } = useTheme()
  const textColor = isDark ? 'text-brand-white' : 'text-brand-black'

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 py-32 flex flex-col items-center text-center gap-6">
      <h1 className={`text-8xl font-heading transition-colors duration-500 ${textColor}`}>
        404
      </h1>
      <p className={`text-2xl font-heading transition-colors duration-500 ${textColor}`}>
        This page seems to have wandered off.
      </p>
      <p className={`font-body font-light transition-colors duration-500 ${textColor}`}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link to="/">
        <Button variant="primary">BACK TO HOME</Button>
      </Link>
    </div>
  )
}

export default NotFound