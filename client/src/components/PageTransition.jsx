import { useLocation } from 'react-router-dom'

function PageTransition({ children }) {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}

export default PageTransition