import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import PlayfulLoader from '../../components/PlayfulLoader'
import api from '../../api/axios'

function StatCard({ label, value }) {
  return (
    <div className="group border border-brand-lightgrey rounded-xl p-5 flex flex-col gap-2 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-brand-gold">
      <p className="font-body text-xs font-semibold tracking-widest uppercase text-brand-grey">
        {label}
      </p>
      <p className="font-body font-bold text-2xl text-brand-gold break-all inline-block origin-left transition-transform duration-300 group-hover:scale-105">
        {value}
      </p>
    </div>
  )
}

const STATUS_STYLES = {
  Placed:     'bg-brand-lightgrey text-brand-black',
  Packed:     'bg-yellow-100 text-yellow-800',
  Dispatched: 'bg-brand-black text-brand-white',
  Delivered:  'bg-green-100 text-green-800',
  Cancelled:  'bg-red-100 text-red-700',
}

function Dashboard() {
  const [orders, setOrders] = useState([])
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/products'),
        ])
        setOrders(ordersRes.data)
        setProductCount(productsRes.data.length)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Revenue counts only orders whose UPI payment has been verified (paid) and
  // that aren't cancelled. Soft-hidden orders are still included so removing a
  // delivered order from the Orders tab never changes the revenue figure.
  const monthRevenue = orders
    .filter((o) => {
      const d = new Date(o.createdAt)
      return (
        o.status !== 'Cancelled' &&
        o.paymentStatus === 'paid' &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      )
    })
    .reduce((sum, o) => sum + o.total, 0)

  // Money still awaiting verification: active (non-cancelled) orders whose
  // payment the admin hasn't marked as received yet.
  const pendingPaymentTotal = orders
    .filter((o) => o.status !== 'Cancelled' && o.paymentStatus !== 'paid')
    .reduce((sum, o) => sum + o.total, 0)

  // Refunds owed: cancelled orders that were paid online but not yet refunded.
  const refundsPending = orders.filter(
    (o) => o.status === 'Cancelled' && o.paymentStatus === 'paid' && o.refundStatus === 'pending'
  )
  const refundsPendingTotal = refundsPending.reduce(
    (sum, o) => sum + (o.refundAmount || o.total),
    0
  )

  // Counts and the recent-orders list show only orders still visible in the tab.
  const visibleOrders = orders.filter((o) => !o.hidden)

  const pendingCount = visibleOrders.filter(
    (o) => o.status === 'Placed' || o.status === 'Packed'
  ).length

  const recentOrders = visibleOrders.slice(0, 5)

  return (
    <AdminLayout>
      <h1 className="text-4xl font-heading text-brand-black mb-8">Dashboard</h1>

      {loading ? (
        <PlayfulLoader variant="admin" />
      ) : (
        <>
          {/* Stats — 1 col on mobile, 2 on sm, 5 on lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <StatCard label="Total Orders" value={visibleOrders.length} />
            <StatCard label="Pending Dispatch" value={pendingCount} />
            <StatCard
              label="Revenue This Month"
              value={'\u20B9' + monthRevenue.toLocaleString('en-IN')}
            />
            <StatCard
              label="Awaiting Payment"
              value={'\u20B9' + pendingPaymentTotal.toLocaleString('en-IN')}
            />
            <StatCard
              label="Refunds Pending"
              value={'\u20B9' + refundsPendingTotal.toLocaleString('en-IN')}
            />
            <StatCard label="Total Products" value={productCount} />
          </div>

          {/* Recent Orders */}
          <div className="border border-brand-lightgrey rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-lightgrey">
              <h2 className="font-body font-semibold text-lg text-brand-black">
                Recent Orders
              </h2>
              <Link
                to="/admin/orders"
                className="link-underline inline-block font-body text-xs font-bold tracking-widest uppercase text-brand-gold transition-all duration-300 active:scale-95"
              >
                View All
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="font-body text-brand-black text-sm px-6 py-8">
                No orders yet.
              </p>
            ) : (
              <div className="divide-y divide-brand-lightgrey">
                {recentOrders.map((order) => (
                  <div key={order._id} className="px-6 py-4 flex flex-col gap-1 transition-colors duration-200 hover:bg-brand-gold/5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-body font-semibold text-sm text-brand-black">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <span
                        className={`font-body text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full flex-shrink-0 ${
                          STATUS_STYLES[order.status] || 'bg-brand-lightgrey text-brand-black'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-body text-xs text-brand-grey truncate">
                        {order.customer.name}
                      </p>
                      <p className="font-body text-sm font-semibold text-brand-black flex-shrink-0">
                        {'\u20B9'}{order.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="font-body text-xs text-brand-grey">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default Dashboard