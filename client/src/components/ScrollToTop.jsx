import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Resets scroll to the very top on every route change. Without this, React
// Router keeps the previous scroll position, so navigating (e.g. Home -> Cart)
// can open a page already scrolled down near the footer, especially on mobile.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    // Also reset the document element in case a browser restored a saved offset.
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}

export default ScrollToTop
