import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import HoverButton from '../components/HoverButton'
import PlayfulLoader from '../components/PlayfulLoader'

const FACES = ['^_^', '>W<', '^O^', '>O<']
const MESSAGES = [
  'ORDER PLACED!',
  "YOU'RE ALL SET!",
  'WOOHOO! IT\'s confirmed!',
  'ORDER RECEIVED!',
]

const SHOP_HOVER    = ['SHOP MORE! ^_^', 'BACK TO CATALOGUE! >O<', 'MORE GOODIES! >W<', 'KEEP BROWSING! ^O^']
const SHOP_LOADING  = ['LOADING CATALOGUE >O<', 'HEADING THERE ^_^', 'ONE SEC >W<', 'ALMOST! ^O^']
const HOME_HOVER    = ['GO HOME! ^_^', 'BACK HOME! >O<', 'HEADING HOME! >W<', 'HOME SWEET HOME! ^O^']
const HOME_LOADING  = ['HEADING HOME >O<', 'ALMOST THERE ^_^', 'ONE SEC >W<', 'LOADING! ^O^']
const TRACK_HOVER   = ['TRACK IT! ^_^', 'FOLLOW MY ORDER! >O<', 'SEE STATUS! >W<', 'GO! ^O^']
const TRACK_LOADING = ['OPENING TRACKER >O<', 'HEADING THERE ^_^', 'ONE SEC >W<', 'ALMOST! ^O^']

function OrderConfirmation() {
  const { isDark }    = useTheme()
  const { state }     = useLocation()
  const navigate      = useNavigate()
  const order         = state?.order
  const trackCode     = order ? order._id.slice(-8).toUpperCase() : ''

  const [pageLoading, setPageLoading] = useState(true)
  const [shopLoading, setShopLoading] = useState(false)
  const [homeLoading, setHomeLoading] = useState(false)
  const [trackLoading, setTrackLoading] = useState(false)

  const [face] = useState(() => FACES[Math.floor(Math.random() * FACES.length)])
  const [msg]  = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])

  const textColor   = isDark ? 'text-brand-white' : 'text-brand-black'
  const borderColor = isDark ? 'border-brand-white' : 'border-brand-black'

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const handleShop = () => {
    setShopLoading(true)
    setTimeout(() => navigate('/catalogue'), 1000)
  }
  const handleHome = () => {
    setHomeLoading(true)
    setTimeout(() => navigate('/'), 1000)
  }
  const handleTrack = () => {
    setTrackLoading(true)
    setTimeout(() => navigate('/track-order', { state: { code: trackCode } }), 800)
  }

  const btnBase = 'flex-1 font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden'

  if (pageLoading) return <PlayfulLoader variant="customer" />

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-24 flex flex-col items-center gap-6">
        <p className={`font-body transition-colors duration-500 ${textColor}`}>No order found.</p>
        <HoverButton
          hoverMessages={HOME_HOVER}
          loadingMessages={HOME_LOADING}
          loading={homeLoading}
          onClick={handleHome}
          className={`${btnBase} bg-brand-gold text-brand-white`}
        >
          GO HOME
        </HoverButton>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 py-16">

      <style>{`
        @keyframes faceBounce {
          0%,100% { transform: translateY(0) scale(1);    }
          40%      { transform: translateY(-10px) scale(1.12); }
          70%      { transform: translateY(-4px) scale(1.05);  }
        }
        .face-bounce { animation: faceBounce 1.6s ease-in-out infinite; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-up { animation: fadeUp 0.5s ease-out both; }
      `}</style>

      <div className="flex flex-col items-center text-center mb-12">
        <div className="face-bounce text-6xl text-brand-gold mb-4 select-none">{face}</div>
        <h1 className={`fade-up text-4xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>{msg}</h1>
        <p className={`fade-up font-body transition-colors duration-500 ${textColor}`}>
          Thank you, {order.customer.name}. We'll get your order ready soon.
        </p>
      </div>

      <div className={`border-2 rounded-xl p-6 flex flex-col gap-5 transition-colors duration-500 ${borderColor}`}>
        <div>
          <p className={`font-body text-xs tracking-widest uppercase mb-1 opacity-60 transition-colors duration-500 ${textColor}`}>Order ID</p>
          <p className={`font-body font-semibold text-sm transition-colors duration-500 ${textColor}`}>{order._id}</p>
        </div>

        <div>
          <p className={`font-body text-xs tracking-widest uppercase mb-1 opacity-60 transition-colors duration-500 ${textColor}`}>Tracking Code</p>
          <p className="font-heading text-3xl text-brand-gold tracking-[0.2em]">{trackCode}</p>
          <p className={`font-body text-xs mt-1 opacity-70 transition-colors duration-500 ${textColor}`}>
            Use this code on the Track Your Order page to follow your delivery.
          </p>
        </div>

        <div className={`border-t transition-colors duration-500 ${borderColor}`} />

        <div className="flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <p className={`font-body text-sm font-semibold transition-colors duration-500 ${textColor}`}>{item.title}</p>
                <p className={`font-body text-xs mt-0.5 opacity-70 transition-colors duration-500 ${textColor}`}>
                  {item.size}{item.colour ? ` · ${item.colour}` : ''} × {item.quantity}
                </p>
                <p className="font-body text-xs text-brand-gold font-semibold mt-0.5">
                  {item.priceType === 'wholesale' ? 'Wholesale rate' : 'Retail rate'}
                </p>
              </div>
              <p className={`font-body font-semibold text-sm transition-colors duration-500 ${textColor}`}>&#8377;{item.lineTotal}</p>
            </div>
          ))}
        </div>

        <div className={`border-t pt-4 transition-colors duration-500 ${borderColor}`}>
          <div className={`flex justify-between font-body text-sm mb-1 transition-colors duration-500 ${textColor}`}>
            <span>Subtotal</span><span>&#8377;{order.subtotal}</span>
          </div>
          <div className={`flex justify-between font-body text-sm mb-3 transition-colors duration-500 ${textColor}`}>
            <span>Shipping</span><span>&#8377;{order.shipping}</span>
          </div>
          <div className={`flex justify-between font-body font-bold text-lg transition-colors duration-500 ${textColor}`}>
            <span>Total</span><span className="text-brand-gold">&#8377;{order.total}</span>
          </div>
        </div>

        <div className={`border-t pt-4 transition-colors duration-500 ${borderColor}`}>
          <p className={`font-body text-sm font-semibold mb-1 transition-colors duration-500 ${textColor}`}>Delivery to</p>
          <p className={`font-body text-sm opacity-80 transition-colors duration-500 ${textColor}`}>
            {order.address.line1}, {order.address.city}
            {order.address.state ? `, ${order.address.state}` : ''} — {order.address.pincode}
          </p>
        </div>

        <div className={`border-t pt-4 flex justify-between items-center transition-colors duration-500 ${borderColor}`}>
          <div>
            <p className={`font-body text-xs tracking-widest uppercase mb-1 opacity-60 transition-colors duration-500 ${textColor}`}>Payment</p>
            <p className={`font-body text-sm font-semibold transition-colors duration-500 ${textColor}`}>Cash on Delivery</p>
          </div>
          <span className="bg-brand-gold text-brand-white text-xs font-body font-bold tracking-widest uppercase px-3 py-1 rounded-full">
            {order.status}
          </span>
        </div>
      </div>

      <HoverButton
        hoverMessages={TRACK_HOVER}
        loadingMessages={TRACK_LOADING}
        loading={trackLoading}
        disabled={shopLoading || homeLoading || trackLoading}
        onClick={handleTrack}
        className={`${btnBase} w-full mt-8 bg-brand-gold text-brand-white`}
      >
        TRACK YOUR ORDER
      </HoverButton>

      <div className="flex gap-4 mt-4">
        <HoverButton
          hoverMessages={SHOP_HOVER}
          loadingMessages={SHOP_LOADING}
          loading={shopLoading}
          disabled={shopLoading || homeLoading || trackLoading}
          onClick={handleShop}
          className={`${btnBase} bg-brand-gold text-brand-white`}
        >
          CONTINUE SHOPPING
        </HoverButton>
        <HoverButton
          hoverMessages={HOME_HOVER}
          loadingMessages={HOME_LOADING}
          loading={homeLoading}
          disabled={shopLoading || homeLoading || trackLoading}
          onClick={handleHome}
          className={`${btnBase} border-2 ${borderColor} ${textColor} hover:bg-brand-gold hover:text-brand-white hover:border-brand-gold`}
        >
          GO HOME
        </HoverButton>
      </div>
    </div>
  )
}

export default OrderConfirmation