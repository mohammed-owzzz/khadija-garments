import { useState, useRef, useCallback, useEffect } from 'react'

const bgColor   = (color)    => ({ backgroundColor: color })
const bgStyle   = (gradient) => ({ background: gradient })
const handlePos = (s, v, hex) => ({
  left:            `calc(${s}% - 8px)`,
  top:             `calc(${100 - v}% - 8px)`,
  backgroundColor: hex,
})

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100
  const f = (n) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d   = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else                h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)]
}

function ColorPicker({ value = '#000000', onChange }) {
  const parseHex = (hex) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return [0, 100, 50]
    return rgbToHsv(...rgb)
  }

  const [hsv, setHsv]           = useState(() => parseHex(value))
  const [hexInput, setHexInput] = useState(value)
  const [open, setOpen]         = useState(false)
  const gradRef                 = useRef(null)
  const pickerRef               = useRef(null)
  const dragging                = useRef(false)

  const [h, s, v] = hsv
  const hex       = rgbToHex(...hsvToRgb(h, s, v))
  const hueColor  = `hsl(${h}, 100%, 50%)`

  useEffect(() => {
    const newHsv = parseHex(value)
    setHsv(newHsv)
    setHexInput(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const applyGradientPos = useCallback(
    (clientX, clientY) => {
      if (!gradRef.current) return
      const rect = gradRef.current.getBoundingClientRect()
      const x    = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y    = Math.max(0, Math.min(1, (clientY - rect.top)  / rect.height))
      const newS = Math.round(x * 100)
      const newV = Math.round((1 - y) * 100)
      setHsv([h, newS, newV])
      const newHex = rgbToHex(...hsvToRgb(h, newS, newV))
      setHexInput(newHex)
      onChange?.(newHex)
    },
    [h, onChange]
  )

  useEffect(() => {
    const onMove = (e) => { if (dragging.current) applyGradientPos(e.clientX, e.clientY) }
    const onUp   = ()  => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [applyGradientPos])

  const onGradMouseDown = (e) => {
    dragging.current = true
    applyGradientPos(e.clientX, e.clientY)
  }

  const onHueChange = (e) => {
    const newH   = Number(e.target.value)
    const newHex = rgbToHex(...hsvToRgb(newH, s, v))
    setHsv([newH, s, v])
    setHexInput(newHex)
    onChange?.(newHex)
  }

  const onHexInputChange = (e) => {
    const raw = e.target.value
    setHexInput(raw)
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      setHsv(parseHex(raw))
      onChange?.(raw)
    }
  }

  return (
    <div className="relative inline-block" ref={pickerRef}>

      {/* Trigger circle */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-10 h-10 rounded-full border-2 border-brand-lightgrey hover:border-brand-gold transition-all duration-200 active:scale-95 shadow-sm flex-shrink-0 focus:outline-none focus:border-brand-gold"
        style={bgColor(hex)}
        title={hex}
      />

      {/* Popover — opens UPWARD so it's never clipped by form boundary */}
      <div
        className={[
          'absolute left-0 bottom-full mb-2 z-50 w-64 bg-white border border-brand-lightgrey',
          'rounded-2xl shadow-xl p-4 flex flex-col gap-4 origin-bottom-left',
          'transition-all duration-200 ease-out',
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none',
        ].join(' ')}
      >
        {/* Gradient canvas */}
        <div
          ref={gradRef}
          onMouseDown={onGradMouseDown}
          className="relative w-full h-36 rounded-xl cursor-crosshair select-none overflow-hidden flex-shrink-0"
          style={bgColor(hueColor)}
        >
          <div className="absolute inset-0 rounded-xl pointer-events-none"
            style={bgStyle('linear-gradient(to right, #ffffff, transparent)')} />
          <div className="absolute inset-0 rounded-xl pointer-events-none"
            style={bgStyle('linear-gradient(to bottom, transparent, #000000)')} />
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
            style={handlePos(s, v, hex)}
          />
        </div>

        {/* Hue slider */}
        <div>
          <p className="font-body text-xs font-semibold tracking-widest uppercase text-brand-grey mb-2">Hue</p>
          <input type="range" min="0" max="360" value={h}
            onChange={onHueChange} className="hue-slider w-full" />
        </div>

        {/* Hex input + preview */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-brand-lightgrey flex-shrink-0 shadow-sm transition-all duration-200"
            style={bgColor(hex)} />
          <div className="flex-1">
            <p className="font-body text-xs font-semibold tracking-widest uppercase text-brand-grey mb-1">Hex</p>
            <input
              type="text" value={hexInput} onChange={onHexInputChange}
              maxLength={7} spellCheck={false}
              className="w-full font-body text-sm border border-brand-lightgrey rounded-lg px-3 py-1.5 text-brand-black outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <style>{`
        .hue-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          border-radius: 9999px;
          background: linear-gradient(to right,
            #ff0000, #ffff00, #00ff00,
            #00ffff, #0000ff, #ff00ff, #ff0000);
          outline: none;
          cursor: pointer;
        }
        .hue-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #D4AF37;
          box-shadow: 0 1px 6px rgba(0,0,0,0.18);
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .hue-slider::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #D4AF37;
          box-shadow: 0 1px 6px rgba(0,0,0,0.18);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

export default ColorPicker