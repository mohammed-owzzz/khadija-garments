import { Navigate } from 'react-router-dom'

// Guards every /admin/* page. A valid admin session (saved by AdminLogin)
// must exist in localStorage, otherwise we redirect to the admin login.
// NOTE: this is a UX/defense-in-depth guard. The REAL enforcement is the
// server-side protect + admin middleware, which rejects tampered requests.
function AdminRoute({ children }) {
  let admin = null
  try {
    admin = JSON.parse(localStorage.getItem('khadija_admin') || 'null')
  } catch {
    admin = null
  }

  if (!admin || !admin.isAdmin || !admin.token) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default AdminRoute