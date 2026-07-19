import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-reveal wrapper. Fades / slides its children into view when they
 * enter the viewport. Pairs with the .reveal utility classes in index.css.
 *
 *   <Reveal>...</Reveal>                         simple fade-up
 *   <Reveal variant="reveal-left" delay={100}>   slide in from the left
 *   <Reveal as="section" className="...">        render a different tag
 */
function Reveal({
  children,
  as: Tag = 'div',
  variant = '',
  delay = 0,
  threshold = 0.15,
  once = true,
  className = '',
  style = {},
  ...rest
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) io.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])

  return (
    <Tag
      ref={ref}
      className={`reveal ${variant} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Reveal