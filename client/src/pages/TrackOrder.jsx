import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import HoverButton from '../components/HoverButton'
import PlayfulLoader from '../components/PlayfulLoader'
import { scrollToField } from '../utils/formScroll'
import api from '../api/axios'

const STATUSES = ['Placed', 'Packed', 'Dispatched', 'Delivered']

const STATUS_INFO = {
  Placed:     { face: '>o<', label: 'Order Placed',    color: 'bg-brand-lightgrey text-brand-black',  desc: 'We have received your order and are getting it ready.' },
  Packed:     { face: '^_^', label: 'Packed',           color: 'bg-yellow-100 text-yellow-800',         desc: 'Your items have been packed and are ready to dispatch.' },
  Dispatched: { face: '>w<', label: 'Dispatched',       color: 'bg-brand-black text-brand-white',       desc: 'Your order is on its way with our delivery partner.' },
  Delivered:  { face: '^o^', label: 'Delivered',        color: 'bg-green-100 text-green-800',           desc: 'Your order has been delivered successfully!' },
  Cancelled:  { face: '>_<', label: 'Cancelled',        color: 'bg-red-100 text-red-700',               desc: 'This order has been cancelled.' },
}

const TRACK_HOVER   = ["LET'S TRACK! ^_^", 'FIND MY ORDER! >O<', 'SHOW STATUS! >W<', 'GO! ^O^']
const TRACK_LOADING = ['SEARCHING >O<', 'ALMOST THERE ^_^', 'ONE SEC >W<', 'LOOKING... ^O^']

function ProgressBar({ currentStatus }) {
  const idx = STATUSES.indexOf(currentStatus)

  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-center justify-between relative">
        {/* Connecting line behind dots */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-lightgrey z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-gold z-0 transition-all duration-700 ease-out"
          style={{ width: idx === 0 ? '0%' : `${(idx / (STATUSES.length - 1)) * 100}%` }}
        />

        {STATUSES.map((status, i) => {
          const done    = i <= idx
          const current = i === idx
          const info    = STATUS_INFO[status]
          return (
            <div key={status} className="flex flex-col items-center gap-2 z-10">
              <div
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg select-none transition-all duration-500',
                  done
                    ? 'bg-brand-gold text-brand-white shadow-md'
                    : 'bg-brand-lightgrey text-brand-grey',
                  current ? 'ring-4 ring-brand-gold/30 scale-110' : '',
                ].join(' ')}
              >
                {info.face}
              </div>
              <span
                className={`font-body text-[11px] font-semibold tracking-wide text-center transition-colors duration-300 ${
                  done ? 'text-brand-gold' : 'text-brand-grey'
                }`}
              >
                {info.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrackOrder() {
  const { isDark }            = useTheme()
  const location              = useLocation()
  const navigate              = useNavigate()
  const prefillCode           = (location.state?.code || '').toUpperCase()
  const [pageLoading, setPageLoading] = useState(true)
  const [code, setCode]       = useState(prefillCode)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [shake, setShake]     = useState(false)

  // Re-trigger the CSS shake animation on each failed lookup. Toggling the
  // class off then on across two frames restarts the animation reliably.
  const fireShake = () => {
    setShake(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setShake(true)))
  }
  const failWith = (msg) => { setError(msg); fireShake(); scrollToField('trackcode') }

  const textColor   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const borderColor = isDark ? 'border-brand-white' : 'border-brand-black'

  const handleTrack = async (codeOverride) => {
    const trimmed = (typeof codeOverride === 'string' ? codeOverride : code).trim().toUpperCase()
    if (!trimmed) { failWith('Please enter your order tracking code'); return }
    if (trimmed.length < 6) { failWith('Tracking code should be at least 6 characters'); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data } = await api.get(`/orders/track/${trimmed}`)
      setResult(data)
    } catch (err) {
      failWith(err?.response?.data?.message || 'Could not find order. Please check your tracking code.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleTrack()
  }

  // Arriving from the order-confirmation page carries the tracking code in
  // router state; prefill it and run the lookup automatically so the live
  // status (as updated by the admin) shows without any typing.
  useEffect(() => {
    if (prefillCode) handleTrack(prefillCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const currentInfo = result ? STATUS_INFO[result.status] : null

  if (pageLoading) return <PlayfulLoader variant="customer" />

  return (
    <div className="page-enter max-w-2xl mx-auto px-6 md:px-8 py-16">
      <h1 className={`text-5xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>
        Track Your Order
      </h1>
      <p className={`font-body text-sm mb-10 transition-colors duration-500 ${
        isDark ? 'text-brand-grey' : 'text-brand-grey'
      }`}>
        Enter the 8-character tracking code from your order confirmation email.
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
          hoverMessages={TRACK_HOVER}
          loadingMessages={TRACK_LOADING}
          loading={loading}
          onClick={handleTrack}
          className="h-12 px-6 w-full sm:w-auto rounded-xl bg-brand-gold text-brand-white font-body font-semibold hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
        >
          TRACK
        </HoverButton>
      </div>

      {/* Reserved-height error row keeps the layout from shifting */}
      <div className="min-h-[1.75rem] mt-3 mb-3">
        {error && <p className="font-body text-sm text-red-500">{error}</p>}
      </div>

      {/* Result */}
      {result && currentInfo && (
        <div
          className={`mt-8 border-2 rounded-2xl p-8 transition-all duration-500 page-enter ${
            borderColor
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className={`font-body text-xs tracking-widest uppercase mb-1 ${
                isDark ? 'text-brand-grey' : 'text-brand-grey'
              }`}>Tracking Code</p>
              <p className={`font-heading text-2xl ${textColor}`}>{result.trackCode}</p>
              <p className={`font-body text-sm mt-1 ${
                isDark ? 'text-brand-grey' : 'text-brand-grey'
              }`}>{result.customer.name}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-body text-xs font-bold tracking-widest uppercase ${currentInfo.color}`}>
              {result.status}
            </div>
          </div>

          {/* Progress bar (hidden for cancelled orders) */}
          {result.status === 'Cancelled' ? (
            <div className="mb-10 rounded-xl p-5 flex items-center gap-4 bg-red-50">
              <span className="text-3xl select-none">{'>_<'}</span>
              <p className="font-body text-sm leading-relaxed text-red-700">
                This order was cancelled and will not be delivered.
              </p>
            </div>
          ) : (
            <div className="mb-10">
              <ProgressBar currentStatus={result.status} />
            </div>
          )}

          {/* Refund status for online-paid orders that were cancelled */}
          {result.refundStatus === 'pending' && (
            <div className="mb-10 rounded-xl p-5 flex items-start gap-4 bg-yellow-50">
              <span className="text-3xl select-none">{'>_<'}</span>
              <div>
                <p className="font-body text-sm font-semibold text-yellow-800">Refund in progress</p>
                <p className="font-body text-sm leading-relaxed text-yellow-700">
                  Your online payment of &#8377;{(result.refundAmount || result.total).toLocaleString('en-IN')} is being refunded. Refunds are processed manually and usually reflect within a few working days.
                </p>
              </div>
            </div>
          )}
          {result.refundStatus === 'refunded' && (
            <div className="mb-10 rounded-xl p-5 flex items-start gap-4 bg-green-50">
              <span className="text-3xl select-none">^o^</span>
              <div>
                <p className="font-body text-sm font-semibold text-green-800">Refund completed</p>
                <p className="font-body text-sm leading-relaxed text-green-700">
                  Your refund of &#8377;{(result.refundAmount || result.total).toLocaleString('en-IN')} has been sent. If you don't see it yet, please allow a little time for your bank to process it.
                </p>
              </div>
            </div>
          )}

          {/* Status message */}
          <div className={`rounded-xl p-5 mb-8 flex items-center gap-4 ${
            isDark ? 'bg-white/5' : 'bg-brand-lightgrey/50'
          }`}>
            <span className="text-3xl select-none">{currentInfo.face}</span>
            <p className={`font-body text-sm leading-relaxed ${textColor}`}>{currentInfo.desc}</p>
          </div>

          {/* Items */}
          <div>
            <p className={`font-body text-xs tracking-widest uppercase mb-3 ${
              isDark ? 'text-brand-grey' : 'text-brand-grey'
            }`}>Order Items</p>
            <div className="flex flex-col gap-2">
              {result.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between font-body text-sm py-2 border-b ${
                    isDark ? 'border-white/10 text-brand-white' : 'border-brand-lightgrey text-brand-black'
                  }`}
                >
                  <span>{item.title} — {item.size}</span>
                  <span className="text-brand-grey">x{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className={`flex justify-between font-body font-bold mt-4 pt-2 ${
              isDark ? 'text-brand-white' : 'text-brand-black'
            }`}>
              <span>Total</span>
              <span className="text-brand-gold">&#8377;{result.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Placed date */}
          <p className={`font-body text-xs mt-6 ${
            isDark ? 'text-brand-grey' : 'text-brand-grey'
          }`}>
            Placed on {new Date(result.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>

          {result.status === 'Placed' && (
            <button
              onClick={() => navigate('/cancel-order', { state: { code: result.trackCode } })}
              className="mt-6 block font-body text-sm font-semibold text-red-500 hover:text-red-600 link-underline transition-colors"
            >
              Need to cancel this order?
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default TrackOrder
