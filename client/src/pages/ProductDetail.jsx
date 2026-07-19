import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import HoverButton from '../components/HoverButton'
import PlayfulLoader from '../components/PlayfulLoader'
import PlayfulMessage from '../components/PlayfulMessage'
import { scrollToField } from '../utils/formScroll'
import api from '../api/axios'

const MAX_QTY = 9999
const NO_IMG_FACES = ['>o<', '^_^', '>w<', '^o^']

const ADD_CART_HOVER    = ['ADD TO CART! ^_^', 'TOSS IT IN! >O<', 'INTO THE BAG! >W<', 'ADD IT! ^O^']
const ADD_CART_MESSAGES = ['ADDING TO CART >O<', 'TOSSING IT IN ^_^', 'ALMOST! >W<', 'GOT IT ^O^']
const BUY_NOW_HOVER     = ['BUY NOW! ^_^', 'GET IT! >O<', 'MINE! >W<', 'ORDER NOW! ^O^']
const BUY_NOW_MESSAGES  = ['PREPARING ORDER >O<', 'ALMOST THERE ^_^', 'JUST A SEC >W<', 'LOADING ^O^']
const CHOOSE_COL_HOVER  = ['PICK A COLOUR! ^_^', 'SO MANY! >O<', 'CHOOSE ONE! >W<', 'GO AHEAD! ^O^']
const CHANGE_COL_HOVER  = ['CHANGE IT! ^_^', 'SWAP IT! >O<', 'NEW COLOUR! >W<', 'PICK ONE! ^O^']
const BACK_HOVER        = ['GO BACK! ^_^', 'CATALOGUE! >O<', 'BACK! >W<', 'ALL ITEMS! ^O^']
const SIZE_GUIDE_HOVER   = ['SIZE GUIDE! ^_^', 'FIND YOUR FIT! >O<', 'MEASUREMENTS! >W<', 'CHECK SIZES! ^O^']
const SIZE_GUIDE_LOADING = ['OPENING GUIDE >O<', 'ONE SEC ^_^', 'LOADING >W<', 'ALMOST ^O^']

const COLOUR_ACKS = [
  { face: '^_^', msg: 'PERFECT CHOICE!'     },
  { face: '>W<', msg: 'GREAT PICK!'         },
  { face: '^O^', msg: 'LOVE THAT COLOUR!'   },
  { face: '>O<', msg: 'BOLD AND BEAUTIFUL!' },
]

function wholesaleProgress(piecesLeft, moq) {
  const pct = piecesLeft / moq
  if (pct <= 0.10) return { face: '>W<', text: `SO CLOSE! JUST ${piecesLeft} MORE PIECE${piecesLeft !== 1 ? 'S' : ''}!` }
  if (pct <= 0.35) return { face: '^_^', text: `ALMOST THERE — ${piecesLeft} MORE TO GO!` }
  const variants = [
    `${piecesLeft} MORE PIECES TO UNLOCK WHOLESALE!`,
    `ADD ${piecesLeft} MORE FOR THE BULK DEAL!`,
    `${piecesLeft} AWAY FROM WHOLESALE PRICING!`,
    `BULK RATE IN ${piecesLeft} PIECES — GO FOR IT!`,
  ]
  return { face: '>O<', text: variants[piecesLeft % variants.length] }
}

function ProductDetail() {
  const { isDark }    = useTheme()
  const { addToCart } = useCart()
  const { id }        = useParams()
  const navigate      = useNavigate()

  const [product, setProduct]               = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [selectedSize, setSelectedSize]     = useState(null)
  const [selectedColour, setSelectedColour] = useState(null)
  const [quantity, setQuantity]             = useState(1)
  const [sizeError, setSizeError]           = useState('')
  const [colourError, setColourError]       = useState('')
  const [shakeSize, setShakeSize]           = useState(false)
  const [shakeColour, setShakeColour]       = useState(false)
  const [showSwatches, setShowSwatches]     = useState(false)
  const [addingToCart, setAddingToCart]     = useState(false)
  const [buyingNow, setBuyingNow]           = useState(false)
  const [added, setAdded]                   = useState(false)
  const [colourAck, setColourAck]           = useState(null)
  const [poppedSize, setPoppedSize]         = useState(null)
  const [sizeGuideLoading, setSizeGuideLoading] = useState(false)

  const colourAckTimer = useRef(null)
  const sizePopTimer   = useRef(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data)
      } catch {
        setError('Product not found.')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  useEffect(() => () => {
    clearTimeout(colourAckTimer.current)
    clearTimeout(sizePopTimer.current)
  }, [])

  // Lock background scrolling while the colour picker (portaled to <body>) is
  // open so it stays centred in the viewport.
  useEffect(() => {
    if (!showSwatches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [showSwatches])

  const textColor   = isDark ? 'text-brand-white' : 'text-brand-black'
  const borderColor = isDark ? 'border-brand-grey' : 'border-brand-lightgrey'

  const qty         = Number(quantity) || 1
  const swatches    = product?.swatches || []
  const hasSwatches = swatches.length > 0
  const moq         = product?.moq || 0
  const isWholesale = moq > 0 && qty >= moq
  const piecesLeft  = Math.max(0, moq - qty)
  const progress    = !isWholesale && moq > 0 ? wholesaleProgress(piecesLeft, moq) : null

  const validateSelection = () => {
    let valid = true
    if (!selectedSize) {
      setSizeError('PLEASE SELECT A SIZE')
      setShakeSize(true)
      setTimeout(() => setShakeSize(false), 400)
      valid = false
    } else { setSizeError('') }
    if (hasSwatches && !selectedColour) {
      setColourError('PLEASE SELECT A COLOUR')
      setShakeColour(true)
      setTimeout(() => setShakeColour(false), 400)
      valid = false
    } else { setColourError('') }
    return valid
  }

  const handleSizeSelect = (size) => {
    setSelectedSize(size)
    setSizeError('')
    clearTimeout(sizePopTimer.current)
    setPoppedSize(size)
    sizePopTimer.current = setTimeout(() => setPoppedSize(null), 400)
  }

  const handleColourSelect = (swatch) => {
    setSelectedColour(swatch)
    setColourError('')
    setShowSwatches(false)
    clearTimeout(colourAckTimer.current)
    const ack = COLOUR_ACKS[Math.floor(Math.random() * COLOUR_ACKS.length)]
    setColourAck(ack)
    colourAckTimer.current = setTimeout(() => setColourAck(null), 2500)
  }

  const handleQuantityChange = (e) => {
    const d = e.target.value.replace(/[^0-9]/g, '')
    setQuantity(d === '' ? '' : Math.min(Number(d) || 0, MAX_QTY))
  }
  const handleQuantityBlur = () => {
    if (!quantity || Number(quantity) < 1) setQuantity(1)
  }

  const colourLabel = (sw) => sw.name + (sw.swatchNo ? ` · ${sw.swatchNo}` : '')

  const buildCartItem = () => ({
    id: product._id, title: product.title,
    retailPrice: product.retailPrice, wholesalePrice: product.wholesalePrice,
    moq: product.moq, image: product.image,
    size: selectedSize,
    colour:    selectedColour ? colourLabel(selectedColour) : '',
    colourHex: selectedColour ? selectedColour.hex : '',
    swatches, quantity: qty,
  })

  const scrollToMissingSelection = () => {
    const key = (hasSwatches && !selectedColour) ? 'colour' : (!selectedSize ? 'size' : null)
    scrollToField(key)
  }

  const handleAddToCart = () => {
    if (!validateSelection()) { scrollToMissingSelection(); return }
    setAddingToCart(true)
    setTimeout(() => {
      addToCart(buildCartItem())
      setAddingToCart(false)
      setAdded(true)
      setTimeout(() => setAdded(false), 3000)
    }, 1200)
  }

  const handleBuyNow = () => {
    if (!validateSelection()) { scrollToMissingSelection(); return }
    setBuyingNow(true)
    setTimeout(() => { addToCart(buildCartItem()); navigate('/cart') }, 1000)
  }

  const handleSizeGuide = () => {
    if (sizeGuideLoading) return
    setSizeGuideLoading(true)
    setTimeout(() => {
      window.open('/size-guide.png', '_blank', 'noopener,noreferrer')
      setSizeGuideLoading(false)
    }, 900)
  }

  const BTN_PRIMARY = 'flex-1 font-body font-semibold px-8 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 ease-out active:scale-95 overflow-hidden'
  const BTN_OUTLINE = `flex-1 font-body font-semibold px-8 py-3 rounded-lg border-2 transition-all duration-300 ease-out active:scale-95 overflow-hidden ${
    isDark
      ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
      : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
  }`

  if (loading) return (
    <div className="page-enter max-w-6xl mx-auto px-6 md:px-8 py-24">
      <PlayfulLoader variant="customer" />
    </div>
  )

  if (error || !product) return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-24 flex flex-col items-center gap-6">
      <p className="font-body text-red-500">{error || 'Product not found.'}</p>
      <HoverButton
        hoverMessages={BACK_HOVER}
        onClick={() => navigate('/catalogue')}
        className="font-body font-semibold px-8 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
      >
        BACK TO CATALOGUE
      </HoverButton>
    </div>
  )

  const noImgFace = NO_IMG_FACES[(product.title?.charCodeAt(0) || 0) % NO_IMG_FACES.length]

  return (
    <div className="page-enter max-w-6xl mx-auto px-6 md:px-8 py-16">

      <style>{`
        @keyframes sizePop {
          0%   { transform: scale(1);    }
          35%  { transform: scale(1.18); }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1);    }
        }
        .size-pop { animation: sizePop 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes swatchPop {
          0%   { transform: scale(1.1);  }
          40%  { transform: scale(1.25); }
          70%  { transform: scale(1.05); }
          100% { transform: scale(1.1);  }
        }
        .swatch-pop { animation: swatchPop 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes ackIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .ack-in { animation: ackIn 0.3s ease-out both; }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .modal-in { animation: modalIn 0.22s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* ─── Images ─── */}
        <div className="flex flex-col gap-4">
          {product.image ? (
            <>
              {/* Front view – left half of the 2-panel photo, crisp <img> rendering */}
              <div className={`relative aspect-[3/4] w-full rounded-xl border overflow-hidden ${borderColor}`}>
                <img
                  src={product.image}
                  alt={`${product.title} – front view`}
                  loading="eager"
                  decoding="async"
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '200%', height: '100%', maxWidth: 'none',
                    objectFit: 'cover', objectPosition: 'left center',
                  }}
                />
              </div>
              {/* Side/back view – right half */}
              <div className={`relative aspect-[3/4] w-full rounded-xl border overflow-hidden ${borderColor}`}>
                <img
                  src={product.image}
                  alt={`${product.title} – side view`}
                  loading="lazy"
                  decoding="async"
                  style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '200%', height: '100%', maxWidth: 'none',
                    objectFit: 'cover', objectPosition: 'right center',
                  }}
                />
              </div>
            </>
          ) : (
            <div className={`aspect-[3/4] rounded-xl border flex items-center justify-center bg-brand-lightgrey ${borderColor}`}>
              <span className="text-6xl select-none text-brand-grey">{noImgFace}</span>
            </div>
          )}
        </div>

        {/* ─── Info ─── */}
        <div className="flex flex-col gap-6">

          {product.badge && (
            <span className="bg-brand-gold text-brand-white text-xs font-body font-bold tracking-widest uppercase px-3 py-1 rounded-full w-fit">
              {product.badge}
            </span>
          )}

          <div>
            <p className={`font-body text-xs tracking-widest uppercase mb-1 transition-colors duration-500 ${textColor}`}>
              Article {product.article}
            </p>
            <h1 className={`text-4xl font-heading transition-colors duration-500 ${textColor}`}>{product.title}</h1>
            <p className={`font-body mt-1 transition-colors duration-500 ${textColor}`}>{product.category?.name}</p>
          </div>

          <div>
            <p className="text-brand-gold font-body font-bold text-2xl">&#8377;{product.retailPrice}</p>
            <p className={`font-body text-sm mt-1 transition-colors duration-500 ${textColor}`}>
              Wholesale &#8377;{product.wholesalePrice} on orders of {product.moq}+ pieces
            </p>
          </div>

          <p className={`font-body font-light leading-relaxed transition-colors duration-500 ${textColor}`}>
            {product.description}
          </p>

          <div className="flex flex-col gap-1">
            {product.fabric && (
              <p className={`font-body text-sm transition-colors duration-500 ${textColor}`}>
                <span className="font-semibold">Fabric:</span> {product.fabric}
              </p>
            )}
            {product.fit && (
              <p className={`font-body text-sm transition-colors duration-500 ${textColor}`}>
                <span className="font-semibold">Fit:</span> {product.fit}
              </p>
            )}
          </div>

          {/* Colour selector */}
          {hasSwatches && (
            <div data-field="colour">
              <p className={`font-body font-medium text-sm mb-3 transition-colors duration-500 ${textColor}`}>SELECT COLOUR</p>
              <div className={shakeColour ? 'shake-error' : ''}>
                <HoverButton
                  hoverMessages={selectedColour ? CHANGE_COL_HOVER : CHOOSE_COL_HOVER}
                  onClick={() => setShowSwatches(true)}
                  className={`font-body font-semibold px-6 py-2.5 text-sm rounded-lg border-2 transition-all duration-300 ease-out active:scale-95 overflow-hidden ${
                    colourError
                      ? 'border-red-500 text-red-500'
                      : isDark
                      ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                      : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                  }`}
                >
                  {selectedColour ? 'CHANGE COLOUR' : `CHOOSE COLOUR (${swatches.length})`}
                </HoverButton>
              </div>
              <div className="h-8 flex items-center gap-2 mt-2">
                {colourAck ? (
                  <p className="ack-in font-body text-sm font-medium text-brand-gold">{colourAck.face} {colourAck.msg}</p>
                ) : selectedColour ? (
                  <>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ backgroundColor: selectedColour.hex }} />
                    <span className={`font-body text-sm font-medium transition-colors duration-500 ${textColor}`}>
                      {colourLabel(selectedColour)}
                    </span>
                  </>
                ) : null}
              </div>
              <p className="h-4 text-red-500 text-xs font-body leading-4">{colourError}</p>
            </div>
          )}

          {/* Size selector */}
          <div data-field="size">
            <div className="flex items-center gap-4 mb-3">
              <p className={`font-body font-medium text-sm transition-colors duration-500 ${textColor}`}>SELECT SIZE</p>
              <HoverButton
                hoverMessages={SIZE_GUIDE_HOVER}
                loadingMessages={SIZE_GUIDE_LOADING}
                loading={sizeGuideLoading}
                onClick={handleSizeGuide}
                className={`font-body text-xs font-semibold px-4 py-2 rounded-lg border-2 transition-all duration-300 ease-out active:scale-95 overflow-hidden ${
                  isDark
                    ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                    : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                }`}
              >
                SIZE GUIDE
              </HoverButton>
            </div>
            <div className={`flex flex-wrap gap-3 ${shakeSize ? 'shake-error' : ''}`}>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={[
                    'min-w-12 h-12 px-3 rounded-lg border-2 font-body font-semibold transition-all duration-300 active:scale-95',
                    selectedSize === size
                      ? 'bg-brand-gold border-brand-gold text-brand-white'
                      : sizeError
                      ? 'border-red-500 text-red-500'
                      : isDark
                      ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                      : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white',
                    poppedSize === size ? 'size-pop' : '',
                  ].join(' ')}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="h-4 text-red-500 text-xs font-body mt-2 leading-4">{sizeError}</p>
          </div>

          {/* Quantity */}
          <div>
            <p className={`font-body font-medium text-sm mb-3 transition-colors duration-500 ${textColor}`}>QUANTITY</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, (Number(q) || 1) - 1))}
                className={`w-10 h-10 rounded-lg border-2 font-body font-semibold transition-all duration-300 active:scale-90 ${
                  isDark
                    ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                    : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                }`}
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={handleQuantityChange}
                onBlur={handleQuantityBlur}
                className={`w-20 h-10 text-center rounded-lg border-2 bg-transparent font-body font-semibold outline-none transition-all duration-300 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold ${
                  isDark ? 'text-brand-white border-brand-grey' : 'text-brand-black border-brand-lightgrey'
                }`}
              />
              <button
                onClick={() => setQuantity((q) => Math.min((Number(q) || 0) + 1, MAX_QTY))}
                className={`w-10 h-10 rounded-lg border-2 font-body font-semibold transition-all duration-300 active:scale-90 ${
                  isDark
                    ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                    : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                }`}
              >
                +
              </button>
            </div>
            <div className="mt-2 h-5">
              {isWholesale ? (
                <PlayfulMessage show={true} variant="wholesale" size="sm" />
              ) : progress ? (
                <PlayfulMessage show={true} size="sm" customFace={progress.face} customMessage={progress.text} />
              ) : null}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <HoverButton
                hoverMessages={ADD_CART_HOVER}
                loadingMessages={ADD_CART_MESSAGES}
                loading={addingToCart}
                disabled={addingToCart || buyingNow}
                onClick={handleAddToCart}
                className={BTN_PRIMARY}
              >
                ADD TO CART
              </HoverButton>
              <HoverButton
                hoverMessages={BUY_NOW_HOVER}
                loadingMessages={BUY_NOW_MESSAGES}
                loading={buyingNow}
                disabled={addingToCart || buyingNow}
                onClick={handleBuyNow}
                className={BTN_OUTLINE}
              >
                BUY NOW
              </HoverButton>
            </div>
            <PlayfulMessage show={added} variant="added" size="sm" />
          </div>

        </div>
      </div>

      {/* Colour picker modal (portaled to <body>) */}
      {showSwatches && createPortal(
        <div
          onClick={() => setShowSwatches(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`modal-in relative w-80 rounded-2xl flex flex-col ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
            style={{ maxHeight: '80vh', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
          >
            <div className={`flex-shrink-0 flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <div>
                <p className={`font-heading text-3xl ${textColor}`}>Select a Colour</p>
                <p className={`font-body text-[11px] opacity-50 ${textColor}`}>{swatches.length} options available</p>
              </div>
              <button
                onClick={() => setShowSwatches(false)}
                className={`border-2 rounded-lg p-1.5 transition-all duration-300 active:scale-90 ${
                  isDark
                    ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                    : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                }`}
              >
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {swatches.map((sw, i) => {
                  const isSelected = selectedColour && colourLabel(selectedColour) === colourLabel(sw)
                  return (
                    <button
                      key={i}
                      onClick={() => handleColourSelect(sw)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all duration-300 active:scale-[0.98] ${
                        isSelected
                          ? 'border-brand-gold bg-brand-gold/10'
                          : isDark ? 'border-white/10 hover:border-white/30' : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <div
                        className={[
                          'relative w-9 h-9 rounded-full flex-shrink-0 transition-all duration-200',
                          isSelected ? 'ring-2 ring-brand-gold ring-offset-1 swatch-pop' : 'ring-1 ring-black/10',
                        ].join(' ')}
                        style={{ backgroundColor: sw.hex }}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check size={14} className="text-brand-white drop-shadow-md" />
                          </span>
                        )}
                      </div>
                      <span className={`font-body text-xs leading-tight text-left ${isSelected ? 'text-brand-gold font-semibold' : `${textColor} opacity-80`}`}>
                        {sw.name}
                        {sw.swatchNo && <span className="block opacity-60 text-[10px]">No. {sw.swatchNo}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default ProductDetail