import { useState, useEffect, useRef } from 'react'

function HoverButton({
  children,
  hoverMessages = [],
  clickMessages = [],
  loadingMessages,          // alias for clickMessages (backward-compat)
  loading = false,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}) {
  // support both prop names
  const cycleMessages = loadingMessages ?? clickMessages

  const [isHovering, setIsHovering] = useState(false)
  const [hoverIdx,   setHoverIdx]   = useState(0)
  const [clickIdx,   setClickIdx]   = useState(0)
  const hoverTimer = useRef(null)
  const clickTimer = useRef(null)

  useEffect(() => {
    if (isHovering && !loading && hoverMessages.length > 0) {
      setHoverIdx(0)
      hoverTimer.current = setInterval(
        () => setHoverIdx((i) => (i + 1) % hoverMessages.length),
        700,
      )
    } else {
      clearInterval(hoverTimer.current)
    }
    return () => clearInterval(hoverTimer.current)
  }, [isHovering, loading, hoverMessages.length])

  useEffect(() => {
    if (loading && cycleMessages.length > 0) {
      setClickIdx(0)
      clickTimer.current = setInterval(
        () => setClickIdx((i) => (i + 1) % cycleMessages.length),
        750,
      )
    } else {
      clearInterval(clickTimer.current)
    }
    return () => clearInterval(clickTimer.current)
  }, [loading, cycleMessages.length])

  const handleMouseEnter = () => { if (!loading && !disabled) setIsHovering(true) }
  const handleMouseLeave = () => setIsHovering(false)

  const handleClick = (e) => {
    setIsHovering(false)
    onClick?.(e)
  }

  let displayText
  if (loading && cycleMessages.length > 0)         displayText = cycleMessages[clickIdx]
  else if (isHovering && hoverMessages.length > 0)  displayText = hoverMessages[hoverIdx]
  else                                               displayText = children

  const allTexts = [children, ...hoverMessages, ...cycleMessages]

  return (
    <button
      type={type}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      className={className}
    >
      <span className="grid w-full max-w-full">
        {allTexts.map((t, i) => (
          <span
            key={i}
            aria-hidden
            className="invisible col-start-1 row-start-1 text-center break-words"
          >
            {t}
          </span>
        ))}
        <span className="col-start-1 row-start-1 flex items-center justify-center gap-2 text-center break-words">
          {displayText}
        </span>
      </span>
    </button>
  )
}

export default HoverButton