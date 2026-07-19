function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) {
  const baseStyles = 'font-body font-semibold px-8 py-3 rounded-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-95'
  const variants = {
    primary: 'bg-brand-gold text-brand-white hover:bg-brand-gold-hover',
    secondary: 'bg-brand-black text-brand-white hover:bg-brand-grey',
    outline: 'bg-transparent border-2 border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white',
  }
  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? disabledStyles : ''} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button