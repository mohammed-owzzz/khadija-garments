import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Catalogue from './pages/Catalogue'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import TrackOrder from './pages/TrackOrder'
import CancelOrder from './pages/CancelOrder'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import Orders from './pages/admin/Orders'
import Products from './pages/admin/Products'
import Categories from './pages/admin/Categories'
import Customers from './pages/admin/Customers'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ── Standalone full-page routes (no navbar/footer) ── */}
        <Route path="/login"        element={<Login />} />
        <Route path="/signup"       element={<Signup />} />
        <Route path="/admin/login"  element={<AdminLogin />} />

        {/* ── Admin routes (guarded) ── */}
        <Route path="/admin/dashboard"  element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/orders"     element={<AdminRoute><Orders /></AdminRoute>} />
        <Route path="/admin/products"   element={<AdminRoute><Products /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><Categories /></AdminRoute>} />
        <Route path="/admin/customers"  element={<AdminRoute><Customers /></AdminRoute>} />

        {/* ── Customer routes with Layout (navbar + footer) ── */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute><Home /></ProtectedRoute>
                } />
                <Route path="/catalogue" element={
                  <ProtectedRoute><Catalogue /></ProtectedRoute>
                } />
                <Route path="/product/:id" element={
                  <ProtectedRoute><ProductDetail /></ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <ProtectedRoute><Cart /></ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute><Checkout /></ProtectedRoute>
                } />
                <Route path="/order-confirmation" element={
                  <ProtectedRoute><OrderConfirmation /></ProtectedRoute>
                } />
                {/* Track order is public — no ProtectedRoute */}
                <Route path="/track-order" element={<TrackOrder />} />
                {/* Cancel order requires login (only your own orders) */}
                <Route path="/cancel-order" element={
                  <ProtectedRoute><CancelOrder /></ProtectedRoute>
                } />
                <Route path="/about"   element={
                  <ProtectedRoute><About /></ProtectedRoute>
                } />
                <Route path="/contact" element={
                  <ProtectedRoute><Contact /></ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
