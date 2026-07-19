import { useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

function OtpInput({ value, onChange, label, error, shake }) {
  const { isDark } = useTheme()
  const inputs = useRef([])

  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[idx] = char
    onChange(newDigits.join(''))
    if (char && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    const nextIdx = Math.min(pasted.length, 5)
    inputs.current[nextIdx]?.focus()
  }

  const textColor = isDark ? 'text-brand-white' : 'text-brand-black'

  const borderColor = (i) => {
    if (error) return 'border-red-500'
    if (digits[i]) return 'border-brand-gold'
    return isDark ? 'border-brand-grey' : 'border-brand-lightgrey'
  }

  const bgColor = isDark ? 'bg-transparent' : 'bg-white'

  return (
    <div className="flex flex-col items-center gap-3">
      <label className={`font-body font-medium text-sm self-start ${textColor}`}>{label}</label>

      {/* Shake wraps the boxes */}
      <div className={`flex justify-center gap-3 ${shake ? 'shake-error' : ''}`}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className={[
              'w-11 h-13 text-center font-body font-semibold text-lg rounded-lg border-2',
              'outline-none transition-all duration-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:scale-110',
              bgColor, textColor, borderColor(i), digits[i] ? 'scale-105' : '',
            ].join(' ')}
          />
        ))}
      </div>

      <p className="h-4 text-red-500 text-xs font-body leading-4 text-center">{error}</p>
    </div>
  )
}

export default OtpInput