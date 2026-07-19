import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, Trash2, IndianRupee, RotateCcw, FileText } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import PlayfulLoader from '../../components/PlayfulLoader'
import HoverButton from '../../components/HoverButton'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'

// Must match the Order model enum EXACTLY (title-case)
const STATUSES = ['Placed', 'Packed', 'Dispatched', 'Delivered', 'Cancelled']

const STATUS_STYLES = {
  Placed:     'bg-brand-lightgrey text-brand-black',
  Packed:     'bg-yellow-100 text-yellow-800',
  Dispatched: 'bg-brand-black text-brand-white',
  Delivered:  'bg-green-100 text-green-800',
  Cancelled:  'bg-red-100 text-red-700',
}

const PAYMENT_STYLES = {
  paid:    'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
}

const REFUND_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800',
  refunded: 'bg-green-100 text-green-800',
}

const STATUS_DESCRIPTIONS = {
  Placed:     'Order received, pending packing.',
  Packed:     'Items packed and ready to ship.',
  Dispatched: 'Order handed to delivery partner.',
  Delivered:  'Successfully delivered to customer.',
  Cancelled:  'Order cancelled by the customer.',
}

const STATUS_FACES = {
  Placed:     '>o<',
  Packed:     '^_^',
  Dispatched: '>w<',
  Delivered:  '^o^',
  Cancelled:  '>_<',
}

const STATUS_ACK_MESSAGES = {
  Placed:     'Order marked as Placed!',
  Packed:     'Packed and ready to roll!',
  Dispatched: 'Order dispatched! On its way!',
  Delivered:  'Delivered! Customer should be happy ^_^',
  Cancelled:  'Order marked as cancelled.',
}

const UPDATE_HOVER    = ['CHANGE STATUS! ^_^', 'UPDATE! >O<', "LET'S GO! >W<", 'PICK ONE! ^O^']
const CONFIRM_HOVER   = ['CONFIRM! ^_^', 'YES, DO IT! >O<', "LET'S GO! >W<", 'UPDATE! ^O^']
const CANCEL_HOVER    = ['CANCEL! ^_^', 'NEVERMIND! >O<', 'GO BACK! >W<', 'NOPE! ^O^']
const CANCEL_CLICK    = ['CANCELLING >O<', 'GOING BACK ^_^', 'OK OK >W<', 'NEVER MIND ^O^']
const CONFIRM_LOADING = ['UPDATING >O<', 'ALMOST ^_^', 'ONE SEC >W<', 'HANG TIGHT ^O^']
const DELETE_HOVER    = ['DELETE! ^_^', 'REMOVE IT! >O<', 'BYE ORDER! >W<', 'CLEAR IT! ^O^']
const DELETE_LOADING  = ['DELETING >O<', 'REMOVING ^_^', 'ONE SEC >W<', 'ALMOST ^O^']
const PAID_HOVER      = ['GOT IT! ^_^', 'MONEY IN! >O<', 'CONFIRM PAID! >W<', 'RECEIVED! ^O^']
const UNPAID_HOVER    = ['UNDO PAID ^_^', 'SET PENDING >O<', 'REVERT >W<', 'NOT YET ^O^']
const PAY_LOADING     = ['SAVING >O<', 'ONE SEC ^_^', 'UPDATING >W<', 'ALMOST ^O^']
const REFUND_HOVER    = ['SENT IT! ^_^', 'REFUNDED! >O<', 'MONEY BACK! >W<', 'DONE! ^O^']
const UNREFUND_HOVER  = ['UNDO REFUND ^_^', 'NOT YET >O<', 'REVERT >W<', 'OOPS ^O^']
const REFUND_LOADING  = ['SAVING >O<', 'ONE SEC ^_^', 'UPDATING >W<', 'ALMOST ^O^']

const BTN_BASE = 'flex-1 font-body font-semibold py-3 rounded-lg transition-all duration-300 ease-out'
const BTN_GOLD = `${BTN_BASE} bg-brand-gold text-brand-white hover:brightness-110 active:scale-95`
const BTN_OUTL = `${BTN_BASE} border-2 border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white active:scale-95`

function StatusUpdateDialog({ order, onConfirm, onCancel }) {
  const [selected, setSelected]     = useState(order.status)
  const [confirming, setConfirming] = useState(false)

  const hasChanged = selected !== order.status

  const handleConfirm = async () => {
    if (!hasChanged) { onCancel(); return }
    setConfirming(true)
    await onConfirm(order._id, selected)
    setConfirming(false)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-brand-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-brand-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-7 pb-5 border-b border-brand-lightgrey">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-4xl select-none transition-all duration-300">
              {STATUS_FACES[selected]}
            </span>
            <h2 className="font-heading text-brand-black text-2xl">Update Order Status</h2>
            <p className="font-body text-xs text-brand-grey">
              #{order._id.slice(-8).toUpperCase()} &middot; {order.customer.name}
            </p>
          </div>
        </div>

        <div className="px-7 py-5 flex flex-col gap-2">
          {STATUSES.map((status) => {
            const isSelected = selected === status
            const isCurrent  = order.status === status
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelected(status)}
                className={[
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-300 active:scale-[0.98] text-left',
                  isSelected
                    ? 'border-brand-gold bg-brand-gold/5'
                    : 'border-brand-lightgrey hover:border-brand-black/20',
                ].join(' ')}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-body font-semibold text-sm ${isSelected ? 'text-brand-gold' : 'text-brand-black'}`}>
                      {status}
                    </span>
                    {isCurrent && (
                      <span className="font-body text-[10px] font-bold tracking-widest uppercase bg-brand-lightgrey text-brand-grey px-2 py-0.5 rounded-full">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <span className="font-body text-xs text-brand-grey">{STATUS_DESCRIPTIONS[status]}</span>
                </div>
                <div className={[
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 ml-3 flex items-center justify-center transition-all duration-300',
                  isSelected ? 'border-brand-gold bg-brand-gold' : 'border-brand-lightgrey',
                ].join(' ')}>
                  {isSelected && <Check size={11} className="text-brand-white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 px-7 pb-7">
          <HoverButton
            hoverMessages={CANCEL_HOVER}
            clickMessages={CANCEL_CLICK}
            onClick={onCancel}
            disabled={confirming}
            className={BTN_OUTL}
          >
            CANCEL
          </HoverButton>
          <HoverButton
            hoverMessages={hasChanged ? CONFIRM_HOVER : []}
            loadingMessages={CONFIRM_LOADING}
            loading={confirming}
            onClick={handleConfirm}
            disabled={!hasChanged}
            className={`${BTN_GOLD} ${!hasChanged ? 'opacity-40 pointer-events-none' : ''}`}
          >
            {hasChanged ? 'CONFIRM' : 'NO CHANGE'}
          </HoverButton>
        </div>
      </div>
    </div>,
    document.body
  )
}

function OrderRow({ order, onStatusUpdate, onSuccess, onDelete, deleting, onMarkPaid, paying, onMarkRefunded, refunding }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleConfirm = async (id, newStatus) => {
    const ok = await onStatusUpdate(id, newStatus)
    if (ok) {
      setDialogOpen(false)
      onSuccess?.(newStatus)
    }
  }

  const formatAddress = (a) =>
    [a.line1, a.city, a.state, a.pincode].filter(Boolean).join(', ')

  const formatItems = (items) =>
    items.map((i) => `${i.title} x${i.quantity}`).join(', ')

  // A refund is owed when a cancelled order was already paid online.
  const needsRefundAction = order.status === 'Cancelled' && order.paymentStatus === 'paid'

  return (
    <>
      <div className="border border-brand-lightgrey rounded-xl p-6 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-body font-semibold text-lg text-brand-black">
              #{order._id.slice(-8).toUpperCase()}
            </p>
            <p className="font-body text-sm text-brand-black">
              {order.customer.name} &middot; {order.customer.phone}
            </p>

            <p className="font-body text-sm text-brand-black">{formatAddress(order.address)}</p>

{order.customerType === 'business' && order.business?.gstin && (
  <div className="mt-2 rounded-lg border-2 border-brand-gold/40 bg-brand-gold/5 px-3 py-2 animate-fade-up">
    <div className="flex items-center gap-1.5 mb-1">
      <FileText size={13} className="text-brand-gold flex-shrink-0" />
      <span className="font-body text-[10px] font-bold tracking-wider uppercase text-brand-gold">GST / Business</span>
    </div>
    <p className="font-body text-sm font-semibold text-brand-black">{order.business.name}</p>
    <p className="font-body text-xs text-brand-black tracking-wider">GSTIN: {order.business.gstin}</p>
    <p className="font-body text-xs text-brand-grey mt-0.5">
      {[order.business.line1, order.business.city, order.business.state, order.business.pincode].filter(Boolean).join(', ')}
    </p>
    {(order.business.contactPerson || order.business.phone || order.business.email) && (
      <p className="font-body text-xs text-brand-grey mt-0.5">
        {[order.business.contactPerson, order.business.phone, order.business.email].filter(Boolean).join(' · ')}
      </p>
    )}
  </div>
)}

<p className="font-body text-xs text-brand-grey mt-1"></p>
            
            <p className="font-body text-sm text-brand-black">{formatItems(order.items)}</p>
            <p className="font-body text-sm text-brand-black">{formatAddress(order.address)}</p>
            <p className="font-body text-xs text-brand-grey mt-1">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            <p className="font-body font-bold text-xl text-brand-gold">
              {'\u20B9'}{order.total.toLocaleString('en-IN')}
            </p>
            <span className={`font-body text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full transition-all duration-300 ${STATUS_STYLES[order.status]}`}>
              {order.status}
            </span>
            <span className="font-body text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-brand-lightgrey text-brand-grey">
              {order.paymentMethod === 'COD' ? 'COD' : 'UPI'}
            </span>
            <span className={`font-body text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full ${PAYMENT_STYLES[order.paymentStatus] || PAYMENT_STYLES.pending}`}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
            </span>
            {order.refundStatus && order.refundStatus !== 'none' && (
              <span className={`font-body text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full ${REFUND_STYLES[order.refundStatus] || ''}`}>
                {order.refundStatus === 'refunded' ? 'Refunded' : 'Refund Pending'}
              </span>
            )}
            {order.paymentRef && (
              <p className="font-body text-[11px] text-brand-grey max-w-full break-all">
                UTR: <span className="font-semibold text-brand-black">{order.paymentRef}</span>
              </p>
            )}
            {order.refundRef && (
              <p className="font-body text-[11px] text-brand-grey max-w-full break-all">
                Refund UTR: <span className="font-semibold text-brand-black">{order.refundRef}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
              <HoverButton
                hoverMessages={UPDATE_HOVER}
                onClick={() => setDialogOpen(true)}
                className="font-body text-sm font-semibold border-2 border-brand-black text-brand-black rounded-lg px-4 py-2 hover:bg-brand-black hover:text-brand-white transition-all duration-300 active:scale-95 whitespace-nowrap"
              >
                UPDATE STATUS
              </HoverButton>
              {order.status !== 'Cancelled' && (
                order.paymentStatus === 'paid' ? (
                  <HoverButton
                    hoverMessages={UNPAID_HOVER}
                    loadingMessages={PAY_LOADING}
                    loading={paying}
                    onClick={() => onMarkPaid(order._id, false)}
                    className="font-body text-sm font-semibold border-2 border-brand-grey text-brand-grey rounded-lg px-4 py-2 hover:bg-brand-grey hover:text-brand-white transition-all duration-300 active:scale-95 whitespace-nowrap overflow-hidden"
                  >
                    MARK UNPAID
                  </HoverButton>
                ) : (
                  <HoverButton
                    hoverMessages={PAID_HOVER}
                    loadingMessages={PAY_LOADING}
                    loading={paying}
                    onClick={() => onMarkPaid(order._id, true)}
                    className="flex items-center gap-1.5 font-body text-sm font-semibold border-2 border-green-600 text-green-700 rounded-lg px-4 py-2 hover:bg-green-600 hover:text-brand-white transition-all duration-300 active:scale-95 whitespace-nowrap overflow-hidden"
                  >
                    <IndianRupee size={15} />
                    MARK AS PAID
                  </HoverButton>
                )
              )}
              {needsRefundAction && (
                order.refundStatus === 'refunded' ? (
                  <HoverButton
                    hoverMessages={UNREFUND_HOVER}
                    loadingMessages={REFUND_LOADING}
                    loading={refunding}
                    onClick={() => onMarkRefunded(order._id, false)}
                    className="font-body text-sm font-semibold border-2 border-brand-grey text-brand-grey rounded-lg px-4 py-2 hover:bg-brand-grey hover:text-brand-white transition-all duration-300 active:scale-95 whitespace-nowrap overflow-hidden"
                  >
                    MARK NOT REFUNDED
                  </HoverButton>
                ) : (
                  <HoverButton
                    hoverMessages={REFUND_HOVER}
                    loadingMessages={REFUND_LOADING}
                    loading={refunding}
                    onClick={() => onMarkRefunded(order._id, true)}
                    className="flex items-center gap-1.5 font-body text-sm font-semibold border-2 border-brand-gold text-brand-gold rounded-lg px-4 py-2 hover:bg-brand-gold hover:text-brand-white transition-all duration-300 active:scale-95 whitespace-nowrap overflow-hidden"
                  >
                    <RotateCcw size={15} />
                    MARK AS REFUNDED
                  </HoverButton>
                )
              )}
              {(order.status === 'Delivered' || order.status === 'Cancelled') && (
                <HoverButton
                  hoverMessages={DELETE_HOVER}
                  loadingMessages={DELETE_LOADING}
                  loading={deleting}
                  onClick={() => onDelete(order._id)}
                  className="flex items-center gap-1.5 font-body text-sm font-semibold border-2 border-red-500 text-red-500 rounded-lg px-4 py-2 hover:bg-red-500 hover:text-brand-white transition-all duration-300 active:scale-95 overflow-hidden whitespace-nowrap"
                >
                  <Trash2 size={15} />
                  DELETE
                </HoverButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {dialogOpen && (
        <StatusUpdateDialog
          order={order}
          onConfirm={handleConfirm}
          onCancel={() => setDialogOpen(false)}
        />
      )}
    </>
  )
}

function Orders() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [statusAck, setStatusAck]   = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [payingId, setPayingId]     = useState(null)
  const [refundingId, setRefundingId] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders')
        setOrders(data)
      } catch {
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  useEffect(() => {
    if (!statusAck) return
    const t = setTimeout(() => setStatusAck(null), 3200)
    return () => clearTimeout(t)
  }, [statusAck])

  const handleStatusUpdate = useCallback(async (id, newStatus) => {
    try {
      const { data } = await api.put(`/orders/${id}/status`, { status: newStatus })
      setOrders((prev) => prev.map((o) => (o._id === id ? data : o)))
      return true
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status')
      return false
    }
  }, [])

  const handleStatusSuccess = useCallback((newStatus) => {
    setStatusAck({
      face: STATUS_FACES[newStatus] || '^_^',
      text: STATUS_ACK_MESSAGES[newStatus] || 'Status updated!',
    })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    if (!id) return
    setDeletingId(id)
    try {
      await api.delete(`/orders/${id}`)
      // brief pause so the playful DELETE loader is visible
      await new Promise((r) => setTimeout(r, 700))
      // Remove from the visible list only. The document stays in the DB
      // (flagged hidden), so the dashboard's monthly revenue is unaffected.
      setOrders((prev) => prev.filter((o) => o._id !== id))
      setStatusAck({ face: '^o^', text: 'Order removed from the list!' })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete order')
    } finally {
      setDeletingId(null)
    }
  }, [confirmDeleteId])

  const handleMarkPaid = useCallback(async (id, paid) => {
    setPayingId(id)
    try {
      const { data } = await api.put(`/orders/${id}/payment`, { paid })
      setOrders((prev) => prev.map((o) => (o._id === id ? data : o)))
      setStatusAck({
        face: paid ? '^o^' : '-_-',
        text: paid ? 'Payment marked as received!' : 'Payment set back to pending.',
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update payment')
    } finally {
      setPayingId(null)
    }
  }, [])

  const handleMarkRefunded = useCallback(async (id, refunded) => {
    setRefundingId(id)
    try {
      const { data } = await api.put(`/orders/${id}/refund`, { refunded })
      setOrders((prev) => prev.map((o) => (o._id === id ? data : o)))
      setStatusAck({
        face: refunded ? '^o^' : '-_-',
        text: refunded ? 'Refund marked as sent!' : 'Refund set back to pending.',
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update refund')
    } finally {
      setRefundingId(null)
    }
  }, [])

  const visibleOrders = orders.filter((o) => !o.hidden)

  return (
    <AdminLayout>
      <h1 className="text-4xl font-heading text-brand-black mb-6">Orders</h1>

      {/* Status-change acknowledgement toast */}
      <div className={`flex items-center gap-3 mb-6 px-5 py-3 rounded-xl border border-brand-gold/30 bg-brand-gold/5 transition-all duration-500 overflow-hidden ${
        statusAck ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 py-0 mb-0 border-0'
      }`}>
        <span className="text-xl font-body text-brand-gold select-none flex-shrink-0">{statusAck?.face}</span>
        <p className="font-body text-sm text-brand-black font-medium">{statusAck?.text}</p>
      </div>

      {loading ? (
        <PlayfulLoader variant="admin" />
      ) : error ? (
        <p className="font-body text-red-500">{error}</p>
      ) : visibleOrders.length === 0 ? (
        <p className="font-body text-brand-black">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {visibleOrders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              onSuccess={handleStatusSuccess}
              onDelete={setConfirmDeleteId}
              deleting={deletingId === order._id}
              onMarkPaid={handleMarkPaid}
              paying={payingId === order._id}
              onMarkRefunded={handleMarkRefunded}
              refunding={refundingId === order._id}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        message="This order will be removed from the orders list. Your revenue totals won't be affected."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AdminLayout>
  )
}

export default Orders