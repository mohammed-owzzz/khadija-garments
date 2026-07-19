import { useTheme } from '../context/ThemeContext'

function Input({ label, type = 'text', placeholder, value, onChange, name, error, invalid = false, required = false, className = '' }) {
  const { isDark } = useTheme()

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className={`font-body font-medium text-sm transition-colors duration-500 ${isDark ? 'text-brand-white' : 'text-brand-black'}`}>
          {label}{required && <span className="text-brand-gold ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full font-body bg-transparent border rounded-lg px-4 py-3 outline-none transition-all duration-500 ease-out focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:shadow-lg focus:shadow-brand-gold/10 ${
          isDark ? 'text-brand-white border-brand-grey placeholder:text-brand-white' : 'text-brand-black border-brand-lightgrey placeholder:text-brand-black'
        } ${error || invalid ? 'border-red-500' : ''} ${className}`}
      />
      {error && (
        <span className="text-red-500 text-xs font-body">{error}</span>
      )}
    </div>
  )
}

export default Input