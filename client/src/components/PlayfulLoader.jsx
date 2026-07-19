import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const FRAMES_CUSTOMER = [
  { face: '>o<', text: 'Fetching the good stuff...' },
  { face: '>_<', text: 'Ironing out the details...' },
  { face: '^_^', text: 'Almost there...' },
  { face: '>o<', text: 'Folding everything nicely...' },
  { face: '~_~', text: 'One moment please...' },
  { face: '^o^', text: 'So many beautiful pieces...' },
]

const FRAMES_ADMIN = [
  { face: '>o<', text: 'Crunching the numbers...' },
  { face: '^_^', text: 'Fetching your data...' },
  { face: '>_<', text: 'Sorting things out...' },
  { face: '~_~', text: 'Almost ready...' },
  { face: '^o^', text: 'Just a moment...' },
]

function PlayfulLoader({ variant = 'customer' }) {
  const { isDark } = useTheme()
  const [frameIndex, setFrameIndex] = useState(0)

  const frames = variant === 'admin' ? FRAMES_ADMIN : FRAMES_CUSTOMER
  const textColor = isDark ? 'text-brand-white' : 'text-brand-black'

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length)
    }, 520)
    return () => clearInterval(interval)
  }, [frames.length])

  const frame = frames[frameIndex]

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 select-none">
      <p
        className={`font-heading text-7xl transition-all duration-300 animate-float ${textColor}`}
        style= {{lineHeight: 1}} 
      >
        {frame.face}
      </p>
      <p className={`font-body text-sm tracking-widest uppercase transition-colors duration-300 ${textColor}`}>
        {frame.text}
      </p>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-gold"
            style={{
              animation: `bounce 0.9s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default PlayfulLoader