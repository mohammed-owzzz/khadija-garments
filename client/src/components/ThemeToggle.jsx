import { useTheme } from '../context/ThemeContext'

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-8 rounded-full border-2 p-1 flex items-center transition-colors duration-500 ease-out ${isDark ? 'bg-brand-black border-brand-white' : 'bg-brand-white border-brand-black'}`}
    >
      <span
        className="w-5 h-5 rounded-full bg-brand-gold"
        style={{
          transform: isDark ? 'translateX(24px)' : 'translateX(0px)',
          transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}
      />
    </button>
  )
}

export default ThemeToggle