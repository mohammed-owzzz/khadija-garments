import { useState, useEffect } from 'react'
import PlayfulLoader from '../../components/PlayfulLoader'
import AdminLayout from '../../components/AdminLayout'
import api from '../../api/axios'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await api.get('/orders')
        const map = {}
        for (const order of data) {
          const key = order.customer.email
          if (!map[key]) {
            map[key] = {
              name: order.customer.name,
              email: order.customer.email,
              phone: order.customer.phone,
              orders: 0,
              spent: 0,
            }
          }
          map[key].orders += 1
          map[key].spent += order.total
        }
        setCustomers(Object.values(map).sort((a, b) => b.orders - a.orders))
      } catch {
        setError('Failed to load customers')
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const gridTemplate = 'grid-cols-[1.5fr_2fr_1.5fr_0.6fr_0.8fr]'

  return (
    <AdminLayout>
      <h1 className="text-4xl font-heading text-brand-black mb-8">Customers</h1>

      {loading ? (
        <PlayfulLoader variant="admin" />
      ) : error ? (
        <p className="font-body text-red-500">{error}</p>
      ) : customers.length === 0 ? (
        <p className="font-body text-brand-black">No customers yet.</p>
      ) : (
        <>
          <div className="hidden md:block border border-brand-lightgrey rounded-xl overflow-hidden">
            <div className={`grid ${gridTemplate} font-body text-sm font-semibold text-brand-black bg-brand-lightgrey`}>
              <p className="px-6 py-4 border-r border-brand-white">Name</p>
              <p className="px-6 py-4 border-r border-brand-white">Email</p>
              <p className="px-6 py-4 border-r border-brand-white">Phone</p>
              <p className="px-6 py-4 border-r border-brand-white">Orders</p>
              <p className="px-6 py-4">Spent</p>
            </div>
            {customers.map((customer) => (
              <div key={customer.email} className={`grid ${gridTemplate} items-center font-body text-sm text-brand-black border-t border-brand-lightgrey transition-colors duration-200 hover:bg-brand-gold/5`}>
                <p className="px-6 py-4 border-r border-brand-lightgrey font-medium truncate">{customer.name}</p>
                <p className="px-6 py-4 border-r border-brand-lightgrey truncate">{customer.email}</p>
                <p className="px-6 py-4 border-r border-brand-lightgrey">{customer.phone}</p>
                <p className="px-6 py-4 border-r border-brand-lightgrey text-center">{customer.orders}</p>
                <p className="px-6 py-4 text-brand-gold font-semibold">&#8377;{customer.spent.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          <div className="md:hidden flex flex-col gap-4">
            {customers.map((customer) => (
              <div key={customer.email} className="border border-brand-lightgrey rounded-xl p-5 flex flex-col gap-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-brand-gold">
                <div className="flex items-start justify-between">
                  <p className="font-body font-semibold text-brand-black text-base">{customer.name}</p>
                  <span className="font-body text-sm text-brand-gold font-semibold flex-shrink-0">
                    {customer.orders} orders
                  </span>
                </div>
                <div className="font-body text-sm text-brand-black flex flex-col gap-1">
                  <p className="break-all">{customer.email}</p>
                  <p>{customer.phone}</p>
                  <p className="text-brand-gold font-semibold">Spent &#8377;{customer.spent.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default Customers