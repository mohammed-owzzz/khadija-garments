import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Card from '../components/Card'
import PlayfulLoader from '../components/PlayfulLoader'
import api from '../api/axios'

function Catalogue() {
  const { isDark }     = useTheme()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const filterParam    = searchParams.get('filter')

  const [products, setProducts]               = useState([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState('')
  const [activeCategory, setActiveCategory]   = useState('All')
  const [displayCategory, setDisplayCategory] = useState('All')
  const [gridVisible, setGridVisible]         = useState(true)
  const [clickedId, setClickedId]             = useState(null) // card being clicked

  const switchTimer = useRef(null)
  const clickTimer  = useRef(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products')
        setProducts(data)
      } catch {
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    setActiveCategory('All')
    setDisplayCategory('All')
  }, [filterParam])

  useEffect(() => () => {
    clearTimeout(switchTimer.current)
    clearTimeout(clickTimer.current)
  }, [])

  // Category switch: fade out → swap → fade in
  const handleCategoryClick = (cat) => {
    if (cat === activeCategory) return
    clearTimeout(switchTimer.current)
    setGridVisible(false)
    switchTimer.current = setTimeout(() => {
      setDisplayCategory(cat)
      setActiveCategory(cat)
      setGridVisible(true)
    }, 220)
  }

  // Card click: scale + fade the card, then navigate
  const handleCardClick = (productId) => {
    if (clickedId) return // prevent double-click
    setClickedId(productId)
    clickTimer.current = setTimeout(() => {
      navigate(`/product/${productId}`)
    }, 320)
  }

  const categories = ['All', ...new Set(products.map((p) => p.category?.name).filter(Boolean))]

  const applyFilterParam = (list) => {
    if (filterParam === 'new')
      return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (filterParam === 'bestsellers')
      return list.filter((p) =>
        p.badge?.toLowerCase().includes('best') || p.badge?.toLowerCase().includes('popular')
      )
    return list
  }

  const byCategoryFilter =
    displayCategory === 'All'
      ? products
      : products.filter((p) => p.category?.name === displayCategory)

  const displayedProducts = applyFilterParam(byCategoryFilter)

  const textColor = isDark ? 'text-brand-white' : 'text-brand-black'

  const pageTitle = () => {
    if (filterParam === 'new') return 'New Arrivals'
    if (filterParam === 'bestsellers') return 'Best Sellers'
    return 'Catalogue'
  }

  const pageSubtitle = () => {
    if (filterParam === 'new') return 'The latest additions to our collection.'
    if (filterParam === 'bestsellers') return 'Our most loved pieces.'
    return 'Browse our full collection of ladies bottom wear.'
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-16">

      <style>{`
        @keyframes cardPop {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .card-pop {
          animation: cardPop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes cardClick {
          0%   { transform: scale(1);    opacity: 1;   }
          40%  { transform: scale(0.94); opacity: 0.7; }
          100% { transform: scale(1.04); opacity: 0;   }
        }
        .card-clicking {
          animation: cardClick 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
        }
      `}</style>

      <div className="mb-12">
        <h1 className={`text-5xl font-heading mb-3 transition-colors duration-500 ${textColor}`}>
          {pageTitle()}
        </h1>
        <p className={`font-body font-light transition-colors duration-500 ${textColor}`}>
          {pageSubtitle()}
        </p>
      </div>

      {loading ? (
        <PlayfulLoader variant="customer" />
      ) : error ? (
        <p className="font-body text-center py-20 text-red-500">{error}</p>
      ) : (
        <>
          {/* Category pills */}
          <div className="flex flex-wrap gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`font-body text-sm font-semibold px-5 py-2 rounded-full border-2 transition-all duration-300 active:scale-95 ${
                  cat === activeCategory
                    ? 'bg-brand-gold border-brand-gold text-brand-white scale-105'
                    : isDark
                    ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                    : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div
            className="transition-all duration-200 ease-in-out"
            style={{
              opacity:   gridVisible ? 1 : 0,
              transform: gridVisible ? 'translateY(0)' : 'translateY(10px)',
          }}
          >
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {displayedProducts.map((product, i) => (
                  <div
                    key={product._id}
                    onClick={() => handleCardClick(product._id)}
                    className={[
                      'cursor-pointer',
                      clickedId === product._id ? 'card-clicking' : 'card-pop',
                    ].join(' ')}
                    style={
                      clickedId === product._id
                        ? {}
                        : { animationDelay: `${i * 40}ms` }
                    }
                  >
                    <Card
                      image={product.image}
                      title={product.title}
                      subtitle={product.category?.name}
                      price={product.retailPrice}
                      badge={product.badge}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-20 gap-3">
                <p className={`font-heading text-5xl transition-colors duration-500 ${textColor}`}>
                  (._.)
                </p>
                <p className={`font-body text-sm transition-colors duration-500 ${textColor}`}>
                  {filterParam === 'bestsellers'
                    ? 'No best sellers yet — add a "Bestseller" badge to products in the admin panel.'
                    : 'No products found in this category.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Catalogue