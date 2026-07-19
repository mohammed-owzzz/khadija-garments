import { useTheme } from '../context/ThemeContext'

function ThemeBackground() {
  const { isDark } = useTheme()

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-brand-white" />
      <div
        className="absolute inset-0 bg-brand-black"
        style={{
          clipPath: isDark ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transition: 'clip-path 0.9s cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      />
    </div>
  )
}

export default ThemeBackground