import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import HoverButton from '../components/HoverButton'
import ConfirmDialog from '../components/ConfirmDialog'
import { scrollToField } from '../utils/formScroll'
import api from '../api/axios'

const FIND_HOVER     = ['FIND IT! ^_^', 'LOOK IT UP! >O<', 'SHOW ORDER! >W<', 'GO! ^O^']
const FIND_LOADING   = ['SEARCHING >O<', 'ONE SEC ^_^', 'LOOKING... >W<', 'ALMOST ^O^']
const CANCEL_HOVER   = ['CANCEL ORDER! ^_^', 'CALL IT OFF! >O<', 'STOP IT! >W<', 'CANCEL! ^O^']
const CANCEL_LOADING = ['CANCELLING >O<', 'ONE SEC ^_^', 'ALMOST >W<', 'HANG TIGHT ^O^']
const SHOP_HOVER     = ['SHOP MORE! ^_^', "LET'S BROWSE! >O<", 'FIND SOMETHING! >W<', "LET'S GO! ^O^"]
const CONFIRM_HOVER  = ['YES, CANCEL! ^_^', 'DO IT! >O<', 'CALL IT OFF! >W<', 'CONFIRM! ^O^']
const CONFIRM_CLICK  = ['CANCELLING >O<', 'DOING IT ^_^', 'OK OK >W<', 'DONE ^O^']

const CANCELLABLE = ['Placed']

const STATUS_COLOR = {
  Placed:     'bg-brand-lightgrey text-brand-black',
  Packed:     'bg-yellow-100 text-yellow-800',
  Dispatched: 'bg-brand-black text-brand-white',
  Delivered:  'bg-green-100 text-green-800',
  Cancelled:  'bg-red-100 text-red-700',
}

function CancelOrder() {
  const { isDark }  = useTheme()
  const location    = useLocation()
  const navigate    = useNavigate()
  const prefillCode = (location.state?.code || '').toUpperCase()

  const [code, setCode]               = useState(prefillCode)
  const [order, setOrder]             = useState(null)
  const [loading, setLoading]         = useState(false)
  const [cancelling, setCancelling]   = useState(false)
  const [error, setError]             = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [done, setDone]               = useState(false)
  const [shake, setShake]             = useState(false)

  // Re-trigger the CSS shake animation on each failed lookup. Toggling the
  // class off then on across two frames restarts the animation reliably.
  const fireShake = () => {
    setShake(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setShake(true)))
  }
  const failWith = (msg) => { setError(msg); fireShake(); scrollToField('trackcode') }

  const textColor   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const borderColor = isDark ? 'border-brand-white' : 'border-brand-black'

  const handleFind = async (codeOverride) => {
    const trimmed = (typeof codeOverride === 'string' ? codeOverride : code).trim().toUpperCase()
    if (!trimmed)           { failWith('Please enter your order tracking code'); return }
    if (trimmed.length < 6) { failWith('Tracking code should be at least 6 characters'); return }
    setLoading(true); setError(''); setOrder(null); setDone(false)
    try {
      const { data } = await api.get(`/orders/track/${trimmed}`)
      setOrder(data)
    } catch (err) {
      failWith(err?.response?.data?.message || 'Could not find that order. Please check your tracking code.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setConfirmOpen(false)
    setCancelling(true)
    setError('')
    try {
      const { data } = await api.put(`/orders/cancel/${order.trackCode}`)
      setOrder((prev) => ({ ...prev, status: data.status, refundStatus: data.refundStatus }))
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not cancel this order. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleFind() }

  const canCancel = order && CANCELLABLE.includes(order.status) && !done

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 py-16">
      <h1 className={`text-5xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>
        Cancel an Order
      </h1>
      <p className="font-body text-sm mb-10 text-brand-grey">
        Enter your 8-character tracking code. Orders can be cancelled any time before they are packed.
      </p>

      {/* Search box */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          data-field="trackcode"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={handleKeyDown}
          onAnimationEnd={() => setShake(false)}
          placeholder="e.g. A1B2C3D4"
          maxLength={8}
          className={[
            'flex-1 min-w-0 h-12 px-4 rounded-xl border-2 bg-transparent font-body font-semibold tracking-widest text-center outline-none transition-all duration-300',
            'focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20',
            isDark
              ? 'border-brand-white text-brand-white placeholder:text-brand-grey'
              : 'border-brand-black text-brand-black placeholder:text-brand-grey',
            shake ? 'shake-error' : '',
          ].join(' ')}
        />
        <HoverButton
          hoverMessages={FIND_HOVER}
          loadingMessages={FIND_LOADING}
          loading={loading}
          onClick={handleFind}
          className="h-12 px-6 w-full sm:w-auto rounded-xl bg-brand-gold text-brand-white font-body font-semibold hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
        >
          FIND ORDER
        </HoverButton>
      </div>

      {/* Reserved-height error row keeps the layout from shifting */}
      <div className="min-h-[1.75rem] mt-3 mb-3">
        {error && <p className="font-body text-sm text-red-500">{error}</p>}
      </div>

      {/* Result */}
      {order && (
        <div className={`mt-8 border-2 rounded-2xl p-8 transition-all duration-500 page-enter ${borderColor}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="font-body text-xs tracking-widest uppercase mb-1 text-brand-grey">Tracking Code</p>
              <p className={`font-heading text-2xl ${textColor}`}>{order.trackCode}</p>
              <p className="font-body text-sm mt-1 text-brand-grey">{order.customer.name}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-body text-xs font-bold tracking-widest uppercase ${STATUS_COLOR[order.status] || 'bg-brand-lightgrey text-brand-black'}`}>
              {order.status}
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <p className="font-body text-xs tracking-widest uppercase mb-3 text-brand-grey">Order Items</p>
            <div className="flex flex-col gap-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between font-body text-sm py-2 border-b ${isDark ? 'border-white/10 text-brand-white' : 'border-brand-lightgrey text-brand-black'}`}
                >
                  <span>{item.title} — {item.size}</span>
                  <span className="text-brand-grey">x{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className={`flex justify-between font-body font-bold mt-4 pt-2 ${textColor}`}>
              <span>Total</span>
              <span className="text-brand-gold">&#8377;{order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Cancel action / status messaging */}
          {done || order.status === 'Cancelled' ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl p-5 flex items-center gap-4 bg-red-50">
                <span className="text-3xl select-none">{'>_<'}</span>
                <p className="font-body text-sm leading-relaxed text-red-700">
                  This order has been cancelled. If this was a mistake, please place a new order or contact us.
                </p>
              </div>
              {order.refundStatus === 'pending' && (
                <div className="rounded-xl p-5 flex items-center gap-4 bg-yellow-50">
                  <span className="text-3xl select-none">{'>_<'}</span>
                  <p className="font-body text-sm leading-relaxed text-yellow-700">
                    Your online payment will be refunded to your account. Refunds are processed manually and usually reflect within a few working days.
                  </p>
                </div>
              )}
              {order.refundStatus === 'refunded' && (
                <div className="rounded-xl p-5 flex items-center gap-4 bg-green-50">
                  <span className="text-3xl select-none">^o^</span>
                  <p className="font-body text-sm leading-relaxed text-green-700">
                    Your refund has been sent. Please allow a little time for your bank to process it.
                  </p>
                </div>
              )}
            </div>
          ) : canCancel ? (
            <HoverButton
              hoverMessages={CANCEL_HOVER}
              loadingMessages={CANCEL_LOADING}
              loading={cancelling}
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center justify-center font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-4 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-brand-white transition-all duration-300 active:scale-95 overflow-hidden"
            >
              CANCEL THIS ORDER
            </HoverButton>
          ) : (
            <div className={`rounded-xl p-5 flex items-center gap-4 ${isDark ? 'bg-white/5' : 'bg-brand-lightgrey/50'}`}>
              <span className="text-3xl select-none">^o^</span>
              <p className={`font-body text-sm leading-relaxed ${textColor}`}>
                This order is already {order.status.toLowerCase()} and can no longer be cancelled.
              </p>
            </div>
          )}
        </div>
      )}

      {!order && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <HoverButton
            hoverMessages={SHOP_HOVER}
            onClick={() => navigate('/catalogue')}
            className="font-body font-semibold px-8 py-3 rounded-lg border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-white transition-all duration-300 active:scale-95 overflow-hidden"
          >
            CONTINUE SHOPPING
          </HoverButton>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        message="This will cancel your order. This action cannot be undone."
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
        cancelLabel="GO BACK"
        confirmLabel="YES, CANCEL"
        confirmHover={CONFIRM_HOVER}
        confirmClick={CONFIRM_CLICK}
      />
    </div>
  )
}

export default CancelOrder