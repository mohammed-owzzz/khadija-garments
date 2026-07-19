import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const VARIANTS = {
  wholesale: [
    'Woohoo! Wholesale rate unlocked!',
    'Bulk buyer spotted \u2014 great price incoming!',
    'You\u2019re buying big \u2014 we love that energy!',
    'Wholesale mode: activated!',
  ],
  contact: [
    'Message sent! We\u2019ll get back to you soon.',
    'Got it! Expect a reply shortly.',
    'Received with love \u2014 we\u2019ll be in touch!',
    'On its way! Talk soon.',
  ],
  added: [
    'Added to your cart!',
    'Tossed right in \u2014 nice pick!',
    'Cart updated. Good taste!',
    'In the bag \u2014 literally!',
  ],
  removed: [
    'Item removed from cart.',
    'Gone! Plenty more to explore.',
    'Removed \u2014 no worries!',
    'Cleared! Keep browsing.',
  ],
}
const FACES = ['>o<', '^_^', '>w<', '^o^', '-_-']

function PlayfulMessage({ show, variant = 'wholesale', size = 'sm', customFace, customMessage }) {
  const { isDark } = useTheme()
  const textColor  = isDark ? 'text-brand-white' : 'text-brand-black'

  const messages = VARIANTS[variant] || VARIANTS.wholesale

  const [msgIdx,  setMsgIdx]  = useState(0)
  const [faceIdx, setFaceIdx] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) { setVisible(false); return }
    setVisible(true)
    setMsgIdx(0)
    setFaceIdx(0)
  }, [show])

  useEffect(() => {
    if (!show || customMessage) return
    const t = setInterval(() => {
      setMsgIdx((i)  => (i + 1) % messages.length)
      setFaceIdx((i) => (i + 1) % FACES.length)
    }, 2500)
    return () => clearInterval(t)
  }, [show, customMessage, messages.length])

  const isLg        = size === 'lg'
  const displayFace = customFace    ?? FACES[faceIdx]
  const displayMsg  = customMessage ?? messages[msgIdx]

  return (
    <div
      className={[
        'flex items-center gap-2 transition-all duration-300 overflow-hidden',
        isLg ? 'h-10' : 'h-5',
        visible && show ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
    >
      <span
        className={[
          'font-body font-normal text-brand-gold flex-shrink-0',
          isLg ? 'text-base' : 'text-xs',
        ].join(' ')}
        style= {{fontFamily: 'monospace' }}
      >
        {displayFace}
      </span>

      <span
        className={[
          'font-body font-normal whitespace-nowrap',
          isLg ? 'text-sm' : 'text-xs',
          textColor,
        ].join(' ')}
      >
        {displayMsg}
      </span>

      {!customMessage && (
        <span className="flex items-center gap-0.5 flex-shrink-0">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={[
                'rounded-full bg-brand-gold flex-shrink-0',
                isLg ? 'w-1.5 h-1.5' : 'w-1 h-1',
              ].join(' ')}
              style={{
                animation: `messageBounce 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </span>
      )}

      <style>{`
        @keyframes messageBounce {
          from { transform: translateY(0px);  }
          to   { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  )
}

export default PlayfulMessage