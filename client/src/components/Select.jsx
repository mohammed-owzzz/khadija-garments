import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

function Select({ options = [], value, onChange, placeholder = 'Select...', error, shake }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={[
          'w-full font-body border rounded-lg px-4 py-2 text-brand-black outline-none bg-transparent',
          'flex items-center justify-between transition-all duration-300',
          'active:scale-[0.98]',
          error
            ? 'border-red-500'
            : open
              ? 'border-brand-gold ring-1 ring-brand-gold'
              : 'border-brand-lightgrey hover:border-brand-black/30',
          shake ? 'shake-error' : '',
        ].join(' ')}
      >
        <span className={selected ? 'text-brand-black' : 'text-brand-black/30'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-brand-black/40 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={[
          'absolute z-50 left-0 right-0 mt-1.5 bg-white border border-brand-lightgrey',
          'rounded-xl shadow-lg overflow-hidden origin-top',
          'transition-all duration-200 ease-out',
          open
            ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none',
        ].join(' ')}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setOpen(false) }}
            className={[
              'w-full text-left px-4 py-2.5 font-body text-sm flex items-center justify-between',
              'transition-all duration-150 hover:translate-x-0.5',
              value === opt.value
                ? 'bg-brand-gold/10 text-brand-gold font-semibold'
                : 'text-brand-black hover:bg-brand-lightgrey/40',
            ].join(' ')}
          >
            {opt.label}
            {value === opt.value && <Check size={14} className="text-brand-gold flex-shrink-0" />}
          </button>
        ))}
        {options.length === 0 && (
          <p className="px-4 py-3 font-body text-sm text-brand-black/40">No options</p>
        )}
      </div>
    </div>
  )
}

export default Select