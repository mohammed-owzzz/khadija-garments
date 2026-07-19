import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Card from '../components/Card'
import HoverButton from '../components/HoverButton'
import PlayfulLoader from '../components/PlayfulLoader'
import api from '../api/axios'

// ── Button messages ──────────────────────────────────────────────────────────
const SHOP_HOVER    = ['SHOP NOW! ^_^',    "LET'S GO! >O<",    'BROWSE ALL! >W<',   'COME ON! ^O^']
const SHOP_LOADING  = ['LOADING >O<',      'HEADING THERE ^_^', 'ONE SEC >W<',       'ALMOST! ^O^']
const VIEW_HOVER    = ['VIEW ALL! ^_^',    'SEE MORE! >O<',     'ALL ITEMS! >W<',    'SHOW ME! ^O^']
const VIEW_LOADING  = ['LOADING >O<',      'FETCHING ^_^',      'ONE SEC >W<',       'ALMOST! ^O^']
const CONTACT_HOVER = ['SAY HELLO! ^_^',  'REACH OUT! >O<',    'CONTACT US! >W<',   'LETS TALK! ^O^']
const CONTACT_LOAD  = ['HEADING THERE >O<','LOADING ^_^',       'ONE SEC >W<',       'ALMOST! ^O^']

// ── Titles to feature (case-insensitive partial match) ───────────────────────
// These match your actual catalogue product titles
const FEATURED_SLUGS = [
  'rayon chicken plazzo',
  'mario coord',
  'rayon 22kg',
  'rayon 17kg',
]

// ── Ticker ───────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'WHOLESALE PRICING',
  'LADIES BOTTOM WEAR',
  'NEW DESIGNS EVERY SEASON',
  'QUALITY FABRIC',
  'BULK ORDERS WELCOME',
  'PAN INDIA SHIPPING',
  'RETAIL & WHOLESALE',
  'EST. IN MUMBAI',
]

// ── USPs ─────────────────────────────────────────────────────────────────────
const USPS = [
  {
    face: '^_^',
    title: 'WHOLESALE PRICING',
    desc: 'Unlock bulk rates the moment you hit our MOQ. The more you order, the more you save.',
  },
  {
    face: '>O<',
    title: 'NEW EVERY SEASON',
    desc: 'Fresh designs dropped every season — ethnic, casual, and everything in between.',
  },
  {
    face: '>W<',
    title: 'QUALITY FABRIC',
    desc: 'Every piece is stitched with care. We never compromise on the fabric or the finish.',
  },
  {
    face: '^O^',
    title: 'PAN INDIA SHIPPING',
    desc: 'We deliver across India. Place your order and we handle the rest, door to door.',
  },
]

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '20+',   label: 'DESIGNS'          },
  { value: '50+',   label: 'COLORWAYS'  },
  { value: '3+',    label: 'YEARS IN TRADE'  },
  { value: '100%',  label: 'QUALITY CHECKED' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div className="inline-flex gap-0" style={{ animation: 'tickerScroll 28s linear infinite' }}>
        {items.map((item, i) => (
          <span
            key={i}
            className="font-body text-xs font-bold tracking-widest uppercase text-brand-white inline-flex items-center"
          >
            <span className="px-6">{item}</span>
            <span className="text-brand-white/40 text-lg leading-none">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function AnimatedCounter({ target, duration = 1800 }) {
  const [count, setCount] = useState(0)
  const ref  = useRef(null)
  const done = useRef(false)
  const numericTarget = parseInt(target.replace(/\D/g, ''), 10)
  const suffix        = target.replace(/[0-9]/g, '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done.current) {
          done.current = true
          const start = performance.now()
          const step  = (now) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased    = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * numericTarget))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [numericTarget, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// ── Main component ────────────────────────────────────────────────────────────
function Home() {
  const { isDark } = useTheme()
  const navigate   = useNavigate()

  // Featured products — fetched from live API
  const [featured,        setFeatured]        = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  // Button loading states
  const [shopLoading,    setShopLoading]    = useState(false)
  const [viewLoading,    setViewLoading]    = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  // Animated hero face
  const [heroFace, setHeroFace] = useState(0)
  const HERO_FACES = ['^_^', '>O<', '>W<', '^O^', '-_-']
  useEffect(() => {
    const t = setInterval(() => setHeroFace((f) => (f + 1) % HERO_FACES.length), 2400)
    return () => clearInterval(t)
  }, [])

  // Fetch products + pick the 4 featured ones by title
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/products')
        // For each featured slug, find the best matching product (case-insensitive)
        const picks = FEATURED_SLUGS.map((slug) =>
          data.find((p) => p.title?.toLowerCase().includes(slug.toLowerCase()))
        ).filter(Boolean)
        setFeatured(picks)
      } catch {
        // silently fail — section just won't render
      } finally {
        setFeaturedLoading(false)
      }
    }
    load()
  }, [])

  const textColor  = isDark ? 'text-brand-white' : 'text-brand-black'
  const mutedColor = isDark ? 'text-brand-white/60' : 'text-brand-black/50'
  const cardBg     = isDark
    ? 'bg-brand-white/5 border-brand-white/10'
    : 'bg-brand-black/[0.03] border-brand-black/8'

  const handleShop    = () => { setShopLoading(true);    setTimeout(() => navigate('/catalogue'), 1000) }
  const handleView    = () => { setViewLoading(true);    setTimeout(() => navigate('/catalogue'), 1000) }
  const handleContact = () => { setContactLoading(true); setTimeout(() => navigate('/contact'),   1000) }

  return (
    <div className="overflow-x-hidden">

      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0);    }
          to   { transform: translateX(-50%); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes facePulse {
          0%,100% { transform: scale(1);    opacity: 1;    }
          50%     { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0);   }
          50%     { transform: translateY(-8px); }
        }
        .hero-text   { animation: heroFadeUp 0.7s ease-out both;        }
        .hero-text-2 { animation: heroFadeUp 0.7s 0.15s ease-out both;  }
        .hero-text-3 { animation: heroFadeUp 0.7s 0.3s ease-out both;   }
        .hero-text-4 { animation: heroFadeUp 0.7s 0.45s ease-out both;  }
        .face-pulse  { animation: facePulse 2.4s ease-in-out infinite;   }
        .float-y     { animation: floatY 3.5s ease-in-out infinite;      }
        .gold-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #f5d97a 40%, #D4AF37 60%, #b8942e 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .card-hover {
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          HERO
      ═════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, #D4AF37 0%, transparent 70%)' }}
        />

        <div className="float-y face-pulse text-5xl md:text-6xl select-none mb-8 text-brand-gold hero-text">
          {HERO_FACES[heroFace]}
        </div>

        <p className={`hero-text-2 font-body text-xs tracking-[0.3em] uppercase mb-4 ${mutedColor}`}>
          WHOLESALE · LADIES BOTTOM WEAR · MUMBAI
        </p>

        <h1
          className={`hero-text-3 font-heading leading-[1.05] mb-6 ${textColor}`}
          style={{ fontSize: 'clamp(3rem, 10vw, 7.5rem)' }}
        >
          Khadija<br />
          <span className="text-brand-gold">Garments</span>
        </h1>

        <p
          className={`hero-text-4 font-body font-light max-w-lg mx-auto mb-10 leading-relaxed ${mutedColor}`}
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}
        >
          Thoughtfully crafted bottom wear for the modern woman —<br className="hidden sm:block" />
          elegance in every fold, delivered wholesale.
        </p>

        <div className="hero-text-4 flex flex-wrap items-center justify-center gap-4">
          <HoverButton
            hoverMessages={SHOP_HOVER}
            loadingMessages={SHOP_LOADING}
            loading={shopLoading}
            onClick={handleShop}
            className="font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-8 py-3.5 bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
          >
            SHOP THE COLLECTION
          </HoverButton>
          <HoverButton
            hoverMessages={CONTACT_HOVER}
            loadingMessages={CONTACT_LOAD}
            loading={contactLoading}
            onClick={handleContact}
            className={`font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-8 py-3.5 border-2 transition-all duration-300 active:scale-95 overflow-hidden ${
              isDark
                ? 'border-brand-white/30 text-brand-white hover:border-brand-white hover:bg-brand-white hover:text-brand-black'
                : 'border-brand-black/30 text-brand-black hover:border-brand-black hover:bg-brand-black hover:text-brand-white'
            }`}
          >
            GET IN TOUCH
          </HoverButton>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 ${mutedColor}`}>
          <span className="font-body text-[10px] tracking-widest uppercase"></span>
          <div className="w-px h-8 bg-brand-gold/40 animate-pulse" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TICKER STRIP
      ═════════════════════════════════════════════════════════ */}
      <div className="bg-brand-gold py-3 overflow-hidden">
        <Ticker />
      </div>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ═════════════════════════════════════════════════════════ */}
      <section className={`py-14 border-b transition-colors duration-500 ${
        isDark ? 'border-brand-white/10' : 'border-brand-black/8'
      }`}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1">
              <p className="font-heading text-brand-gold leading-none"
                style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                <AnimatedCounter target={value} />
              </p>
              <p className={`font-body text-xs tracking-widest uppercase ${mutedColor}`}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED PRODUCTS — live from API
      ═════════════════════════════════════════════════════════ */}
      <section className={`py-20 transition-colors duration-500 ${
        isDark ? 'bg-brand-white/[0.03]' : 'bg-brand-black/[0.025]'
      }`}>
        <div className="max-w-6xl mx-auto px-6">

          <div className="flex items-end justify-between mb-10">
            <div>
              <p className={`font-body text-xs tracking-[0.25em] uppercase mb-2 ${mutedColor}`}>HANDPICKED</p>
              <h2
                className={`font-heading leading-tight transition-colors duration-500 ${textColor}`}
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                Featured Pieces
              </h2>
            </div>
            <HoverButton
              hoverMessages={VIEW_HOVER}
              loadingMessages={VIEW_LOADING}
              loading={viewLoading}
              onClick={handleView}
              className={`hidden sm:block font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-5 py-2.5 border-2 transition-all duration-300 active:scale-95 overflow-hidden ${
                isDark
                  ? 'border-brand-white/30 text-brand-white hover:border-brand-white hover:bg-brand-white hover:text-brand-black'
                  : 'border-brand-black/25 text-brand-black hover:border-brand-black hover:bg-brand-black hover:text-brand-white'
              }`}
            >
              VIEW ALL
            </HoverButton>
          </div>

          {/* Loading state */}
          {featuredLoading ? (
            <div className="flex justify-center py-16">
              <PlayfulLoader />
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featured.map((product) => (
                <Card
                  key={product._id}
                  image={product.image}
                  title={product.title}
                  subtitle={product.category?.name}
                  price={product.wholesalePrice}
                  badge={product.badge || undefined}
                  onClick={() => navigate(`/product/${product._id}`)}
                />
              ))}
            </div>
          ) : (
            // Fallback if API had no matches
            <p className={`text-center font-body text-sm ${mutedColor}`}>
              No featured products found.
            </p>
          )}

          {/* Mobile CTA */}
          <div className="mt-8 flex justify-center sm:hidden">
            <HoverButton
              hoverMessages={VIEW_HOVER}
              loadingMessages={VIEW_LOADING}
              loading={viewLoading}
              onClick={handleView}
              className="font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-8 py-3 bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
            >
              VIEW ALL PRODUCTS
            </HoverButton>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          USP STRIP
      ═════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className={`font-body text-xs tracking-[0.25em] uppercase mb-2 ${mutedColor}`}>WHY US</p>
          <h2
            className={`font-heading leading-tight transition-colors duration-500 ${textColor}`}
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            The Khadija Promise
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {USPS.map(({ face, title, desc }) => (
            <div
              key={title}
              className={`card-hover rounded-2xl p-6 border flex flex-col gap-3 transition-colors duration-500 ${cardBg}`}
            >
              <div className="text-brand-gold font-heading text-2xl select-none">{face}</div>
              <p className={`font-body font-bold text-xs tracking-widest uppercase transition-colors duration-500 ${textColor}`}>
                {title}
              </p>
              <p className={`font-body text-sm leading-relaxed ${mutedColor}`}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BRAND STORY
      ═════════════════════════════════════════════════════════ */}
      <section className={`py-24 transition-colors duration-500 ${
        isDark ? 'bg-brand-white text-brand-black' : 'bg-brand-black text-brand-white'
      }`}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-body text-xs tracking-[0.25em] uppercase mb-4 text-brand-gold">
              OUR STORY
            </p>
            <h2
              className="font-heading leading-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              Craft, Quality &<br />Community.
            </h2>
            <p className="font-body font-light leading-relaxed mb-4 opacity-75 max-w-md">
              Khadija Garments was founded on a simple belief — that comfort and
              elegance should never be at odds. Every piece is designed with intention,
              blending timeless silhouettes with everyday wearability.
            </p>
            <p className="font-body font-light leading-relaxed opacity-75 max-w-md">
              Based in Mumbai, we work directly with manufacturers to bring you
              wholesale-priced ladies bottom wear without compromising on quality.
              From ethnic palazzos to everyday trousers — we have it all.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <div className="w-8 h-px bg-brand-gold" />
              <p className="font-body text-xs tracking-widest uppercase text-brand-gold">
                SHAIKH FEROZ HUSSAIN, CEO
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { face: '^_^', label: 'ETHNIC',   sub: 'Traditional designs' },
              { face: '>O<', label: 'CASUAL',   sub: 'Everyday comfort'    },
              { face: '>W<', label: 'FORMAL',   sub: 'Structured elegance' },
              { face: '^O^', label: 'SEASONAL', sub: 'Limited editions'    },
            ].map(({ face, label, sub }) => (
              <div
                key={label}
                className={`rounded-xl p-5 flex flex-col gap-2 transition-all duration-300 ${
                  isDark
                    ? 'bg-brand-black/10 hover:bg-brand-black/20'
                    : 'bg-brand-white/10 hover:bg-brand-white/15'
                }`}
              >
                <span className="text-brand-gold text-xl select-none">{face}</span>
                <p className="font-body font-bold text-xs tracking-widest uppercase">{label}</p>
                <p className="font-body text-xs opacity-60">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHOLESALE CTA BANNER
      ═════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, #D4AF37 0%, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl mb-6 select-none face-pulse">^_^</div>
          <h2
            className={`font-heading mb-4 leading-tight transition-colors duration-500 ${textColor}`}
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Ready to Order{' '}
            <span className="text-brand-gold">Wholesale?</span>
          </h2>
          <p className={`font-body font-light leading-relaxed max-w-lg mx-auto mb-10 ${mutedColor}`}>
            Get the best prices on bulk orders. Browse our full catalogue and unlock wholesale
            rates automatically when you add 12+ pieces of any item.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <HoverButton
              hoverMessages={SHOP_HOVER}
              loadingMessages={SHOP_LOADING}
              loading={shopLoading}
              onClick={handleShop}
              className="font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-8 py-3.5 bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
            >
              BROWSE CATALOGUE
            </HoverButton>
            <HoverButton
              hoverMessages={CONTACT_HOVER}
              loadingMessages={CONTACT_LOAD}
              loading={contactLoading}
              onClick={handleContact}
              className={`font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-8 py-3.5 border-2 transition-all duration-300 active:scale-95 overflow-hidden ${
                isDark
                  ? 'border-brand-white/30 text-brand-white hover:border-brand-white hover:bg-brand-white hover:text-brand-black'
                  : 'border-brand-black/30 text-brand-black hover:border-brand-black hover:bg-brand-black hover:text-brand-white'
              }`}
            >
              CONTACT US
            </HoverButton>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home