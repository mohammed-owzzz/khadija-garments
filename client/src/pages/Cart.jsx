import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import HoverButton from '../components/HoverButton'
import PlayfulMessage from '../components/PlayfulMessage'

const MAX_QTY = 9999
const bgHex = (hex) => ({ backgroundColor: hex })

const CHECKOUT_HOVER   = ["LET'S GO! ^_^", 'ORDER TIME! >O<', 'ALMOST THERE! >W<', 'CHECKOUT! ^O^']
const CHECKOUT_LOADING = ['HEADING TO CHECKOUT >O<', 'ALMOST THERE ^_^', 'LOADING >W<', 'JUST A SEC ^O^']
const SHOPPING_HOVER   = ['SHOP MORE! ^_^', "LET'S BROWSE! >O<", 'MORE GOODIES! >W<', 'KEEP GOING! ^O^']
const SHOPPING_LOADING = ['HEADING THERE >W<', 'LOADING CATALOGUE ^_^', 'ONE SEC >O<', 'ALMOST! ^O^']
const ADD_MORE_HOVER   = ['ADD MORE! ^_^', 'KEEP GOING! >O<', 'MORE STUFF! >W<', "LET'S GO! ^O^"]
const ADD_MORE_LOADING = ['LOADING CATALOGUE >O<', 'HEADING THERE ^_^', 'ONE SEC >W<', 'ALMOST! ^O^']
const REMOVE_HOVER     = ['REMOVE! ^_^', 'GONE! >O<', 'BYE BYE! >W<', 'OUT IT GOES! ^O^']
const REMOVE_LOADING   = ['REMOVING >O<', 'ON IT ^_^', 'ALMOST >W<', 'DONE ^O^']

const COLOUR_ACKS = [
  { face: '^_^', msg: 'COLOUR UPDATED!'   },
  { face: '>W<', msg: 'GREAT SWAP!'       },
  { face: '^O^', msg: 'LOVE THAT CHANGE!' },
  { face: '>O<', msg: 'LOOKING GOOD!'     },
]

const EMPTY_FACES    = ['>O<', '^_^', '>W<', '^O^']
const EMPTY_MESSAGES = [
  'CART CLEARED! READY TO REFILL? >O<',
  'ALL GONE! SHOP AGAIN? ^_^',
  'FRESH START! >W<',
  'CART EMPTIED! BACK TO BROWSING? ^O^',
]

function Cart() {
  const { isDark } = useTheme()
  const navigate   = useNavigate()
  const { items, removeFromCart, setLineQuantity, setLineColour, cartTotal, lineUnitPrice, lineTotal } = useCart()

  const [colourPicker, setColourPicker]       = useState(null)
  const [removingKeys, setRemovingKeys]       = useState(new Set())
  const [removeBtnKey, setRemoveBtnKey]       = useState(null)
  const [removedMsg, setRemovedMsg]           = useState(false)
  const [justEmptied, setJustEmptied]         = useState(false)
  const removedTimer                          = useRef(null)
  const [newKeys, setNewKeys]                 = useState(new Set())
  const prevItemsRef                          = useRef([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [shopping, setShopping]               = useState(false)
  const [addingMore, setAddingMore]           = useState(false)
  const [emptyMsgIdx, setEmptyMsgIdx]         = useState(0)
  const emptyInterval                         = useRef(null)
  const [colourAck, setColourAck]             = useState(null)
  const colourAckTimer                        = useRef(null)

  const textColor   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const borderColor = isDark ? 'border-brand-white' : 'border-brand-black'
  const total       = cartTotal

  useEffect(() => () => {
    clearTimeout(removedTimer.current)
    clearTimeout(colourAckTimer.current)
    clearInterval(emptyInterval.current)
  }, [])

  // Lock background scrolling while the colour picker is open so the modal
  // (portaled to <body>) stays put and centred in the viewport.
  useEffect(() => {
    if (!colourPicker) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [colourPicker])

  useEffect(() => {
    const prevKeys  = new Set(prevItemsRef.current.map((i) => `${i.id}-${i.size}-${i.colour}`))
    const addedKeys = items.map((i) => `${i.id}-${i.size}-${i.colour}`).filter((k) => !prevKeys.has(k))
    if (addedKeys.length > 0) {
      setNewKeys(new Set(addedKeys))
      setTimeout(() => setNewKeys(new Set()), 600)
    }
    prevItemsRef.current = items
  }, [items])

  useEffect(() => {
    if (justEmptied) {
      setEmptyMsgIdx(0)
      emptyInterval.current = setInterval(() => setEmptyMsgIdx((i) => (i + 1) % EMPTY_MESSAGES.length), 1800)
    } else {
      clearInterval(emptyInterval.current)
    }
    return () => clearInterval(emptyInterval.current)
  }, [justEmptied])

  const handleRemove = (id, size, colour) => {
    const key      = `${id}-${size}-${colour}`
    const willEmpty = items.length === 1
    setRemoveBtnKey(key)
    setTimeout(() => {
      setRemovingKeys((prev) => new Set([...prev, key]))
      setTimeout(() => {
        removeFromCart(id, size, colour)
        setRemovingKeys((prev) => { const n = new Set(prev); n.delete(key); return n })
        setRemoveBtnKey(null)
        clearTimeout(removedTimer.current)
        setRemovedMsg(true)
        if (willEmpty) setJustEmptied(true)
        removedTimer.current = setTimeout(() => { setRemovedMsg(false); setJustEmptied(false) }, 4000)
      }, 350)
    }, 800)
  }

  const handleCheckout         = () => { setCheckoutLoading(true); setTimeout(() => navigate('/checkout'), 1200) }
  const handleContinueShopping = () => { setShopping(true);        setTimeout(() => navigate('/catalogue'), 1200) }
  const handleAddMore          = () => { setAddingMore(true);      setTimeout(() => navigate('/catalogue'), 1200) }

  const handleQuantityChange = (item, value) => {
    const d = value.replace(/[^0-9]/g, '')
    setLineQuantity(item.id, item.size, item.colour, d === '' ? '' : Math.min(Number(d) || 0, MAX_QTY))
  }
  const handleQuantityBlur = (item) => {
    if (!item.quantity || Number(item.quantity) < 1) setLineQuantity(item.id, item.size, item.colour, 1)
  }
  const decreaseQuantity = (item) =>
    setLineQuantity(item.id, item.size, item.colour, Math.max(1, (Number(item.quantity) || 1) - 1))
  const increaseQuantity = (item) =>
    setLineQuantity(item.id, item.size, item.colour, Math.min((Number(item.quantity) || 0) + 1, MAX_QTY))

  const getColourLabel = (swatch) => swatch.name + (swatch.swatchNo ? ` · ${swatch.swatchNo}` : '')

  const handleColourChange = (swatch) => {
    setLineColour(colourPicker.id, colourPicker.size, colourPicker.colour, getColourLabel(swatch), swatch.hex)
    setColourPicker(null)
    clearTimeout(colourAckTimer.current)
    const ack = COLOUR_ACKS[Math.floor(Math.random() * COLOUR_ACKS.length)]
    setColourAck(ack)
    colourAckTimer.current = setTimeout(() => setColourAck(null), 2500)
  }

  const BTN_PRIMARY = 'font-body font-semibold px-8 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 ease-out active:scale-95 overflow-hidden'
  const BTN_OUTLINE = `font-body font-semibold px-8 py-3 rounded-lg border-2 transition-all duration-300 ease-out active:scale-95 overflow-hidden ${
    isDark
      ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
      : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
  }`

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">

      <style>{`
        @keyframes slideInItem {
          from { opacity: 0; transform: translateX(24px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideOutItem {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(-32px) scale(0.95); }
        }
        .item-enter  { animation: slideInItem  0.4s cubic-bezier(0.22,1,0.36,1) forwards; }
        .item-remove { animation: slideOutItem 0.35s ease-in forwards; }
        @keyframes emptyBounce {
          0%,100% { transform: translateY(0);   }
          50%     { transform: translateY(-6px); }
        }
        .empty-icon { animation: emptyBounce 2s ease-in-out infinite; }
        @keyframes emptyEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .empty-enter { animation: emptyEnter 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes swatchPop {
          0%   { transform: scale(1.1);  }
          40%  { transform: scale(1.25); }
          70%  { transform: scale(1.05); }
          100% { transform: scale(1.1);  }
        }
        .swatch-pop { animation: swatchPop 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes ackIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .ack-in { animation: ackIn 0.28s ease-out both; }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0);      }
        }
        .modal-in { animation: modalIn 0.22s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <h1 className={`text-5xl font-heading mb-2 transition-colors duration-500 ${textColor}`}>Your Cart</h1>

      <div className="h-6 mb-4">
        {colourAck && (
          <p className="ack-in font-body text-sm font-medium text-brand-gold">{colourAck.face} {colourAck.msg}</p>
        )}
      </div>

      {/* ── EMPTY STATE ── */}
      {items.length === 0 && (
        <div className="empty-enter flex flex-col items-center gap-6 py-20">
          <div className="flex flex-col items-center justify-center gap-3 min-h-[8rem]">
            {justEmptied ? (
              <>
                <div className="empty-icon text-5xl select-none text-brand-gold">{EMPTY_FACES[emptyMsgIdx]}</div>
                <p className={`font-body text-lg text-center transition-all duration-500 ${textColor}`}>
                  {EMPTY_MESSAGES[emptyMsgIdx]}
                </p>
              </>
            ) : (
              <p className={`font-body transition-colors duration-500 ${textColor}`}>Your cart is empty.</p>
            )}
          </div>
          <HoverButton
            hoverMessages={SHOPPING_HOVER}
            loadingMessages={SHOPPING_LOADING}
            loading={shopping}
            onClick={handleContinueShopping}
            className={BTN_PRIMARY}
          >
            CONTINUE SHOPPING
          </HoverButton>
        </div>
      )}

      {/* ── ITEMS ── */}
      {items.length > 0 && (
        <>
          <div className="h-6 mb-4">
            <PlayfulMessage show={removedMsg} variant="removed" size="sm" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left — item list */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {items.map((item) => {
                const key               = `${item.id}-${item.size}-${item.colour}`
                const quantity          = Number(item.quantity) || 0
                const isWholesale       = quantity >= item.moq
                const piecesToWholesale = Math.max(0, item.moq - quantity)
                const isRemoving        = removingKeys.has(key)
                const isNew             = newKeys.has(key)
                const isRemoveLoading   = removeBtnKey === key

                return (
                  <div
                    key={key}
                    className={[
                      'flex flex-col sm:flex-row sm:items-center gap-6 border rounded-xl p-4',
                      `transition-colors duration-500 ${borderColor}`,
                      isNew      ? 'item-enter'  : '',
                      isRemoving ? 'item-remove' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-24 h-48 sm:h-32 bg-brand-lightgrey rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '200%', height: '100%', maxWidth: 'none',
                            objectFit: 'cover', objectPosition: 'left center',
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl select-none text-brand-grey">^_^</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-body font-semibold text-lg transition-colors duration-500 ${textColor}`}>{item.title}</h3>
                      <p className={`font-body text-sm mt-1 transition-colors duration-500 ${textColor}`}>Size: {item.size}</p>

                      {item.colour && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {item.colourHex && (
                            <div className="w-4 h-4 rounded-full ring-1 ring-black/10" style={bgHex(item.colourHex)} />
                          )}
                          <p className={`font-body text-sm transition-colors duration-500 ${textColor}`}>{item.colour}</p>
                          {item.swatches?.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setColourPicker(item)}
                              className="inline-block text-brand-gold font-body text-xs font-semibold hover:underline transition-all duration-300 active:scale-95"
                            >
                              CHANGE
                            </button>
                          )}
                        </div>
                      )}

                      <p className="text-brand-gold font-body font-bold mt-3">
                        ₹{lineUnitPrice(item)}
                        <span className={`font-body font-normal text-xs ml-2 transition-colors duration-500 ${textColor}`}>
                          {isWholesale ? 'WHOLESALE RATE' : 'RETAIL RATE'}
                        </span>
                      </p>

                      <div className="mt-1 min-h-[1.25rem]">
                        {isWholesale ? (
                          <PlayfulMessage show={true} variant="wholesale" size="sm" />
                        ) : (
                          <p className="h-5 font-body text-xs leading-5 text-brand-gold">
                            ADD {piecesToWholesale} MORE FOR WHOLESALE (₹{item.wholesalePrice} EACH)
                          </p>
                        )}
                      </div>

                      {/* Qty stepper */}
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item)}
                          className={`w-9 h-9 rounded-lg border-2 font-body font-semibold transition-all duration-300 ease-out active:scale-90 ${
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
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item, e.target.value)}
                          onBlur={() => handleQuantityBlur(item)}
                          className={`w-20 h-9 text-center rounded-lg border-2 bg-transparent font-body font-semibold outline-none transition-all duration-300 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold ${
                            isDark ? 'text-brand-white border-brand-white' : 'text-brand-black border-brand-black'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item)}
                          className={`w-9 h-9 rounded-lg border-2 font-body font-semibold transition-all duration-300 ease-out active:scale-90 ${
                            isDark
                              ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                              : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price + remove */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:self-start">
                      <p className={`font-body font-bold transition-colors duration-500 ${textColor}`}>₹{lineTotal(item)}</p>
                      <HoverButton
                        hoverMessages={REMOVE_HOVER}
                        loadingMessages={REMOVE_LOADING}
                        loading={isRemoveLoading}
                        disabled={isRemoving}
                        onClick={() => !isRemoveLoading && !isRemoving && handleRemove(item.id, item.size, item.colour)}
                        className="text-brand-gold font-body text-sm font-semibold hover:underline transition-all duration-300 active:scale-90 overflow-hidden"
                      >
                        REMOVE
                      </HoverButton>
                    </div>
                  </div>
                )
              })}

              <HoverButton
                hoverMessages={ADD_MORE_HOVER}
                loadingMessages={ADD_MORE_LOADING}
                loading={addingMore}
                onClick={handleAddMore}
                className={`w-fit ${BTN_OUTLINE}`}
              >
                + ADD MORE PRODUCTS
              </HoverButton>
            </div>

            {/* Right — order summary */}
            <div className={`border rounded-xl p-6 h-fit transition-colors duration-500 ${borderColor}`}>
              <h2 className={`font-body font-semibold text-xl mb-6 transition-colors duration-500 ${textColor}`}>
                Order Summary
              </h2>
              <div className={`flex justify-between font-body mb-3 transition-colors duration-500 ${textColor}`}>
                <span>Subtotal</span><span>₹{cartTotal}</span>
              </div>
              <div className={`flex justify-between font-body mb-1 transition-colors duration-500 ${textColor}`}>
                <span>Shipping</span><span className="text-brand-gold font-semibold">Extra*</span>
              </div>
              <p className="font-body text-xs text-brand-gold mb-3">
                *Shipping charges are billed separately, payable on delivery. Free within Mumbai ^_^
              </p>
              <div className={`border-t my-4 transition-colors duration-500 ${borderColor}`} />
              <div className={`flex justify-between font-body font-bold text-lg mb-6 transition-colors duration-500 ${textColor}`}>
                <span>Total</span><span className="text-brand-gold">₹{total}</span>
              </div>
              <HoverButton
                hoverMessages={CHECKOUT_HOVER}
                loadingMessages={CHECKOUT_LOADING}
                loading={checkoutLoading}
                onClick={handleCheckout}
                className="w-full font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-200 active:scale-95 overflow-hidden"
              >
                PROCEED TO CHECKOUT
              </HoverButton>
            </div>
          </div>
        </>
      )}

      {/* ── COLOUR PICKER MODAL (portaled to <body> so a transformed page
             wrapper can't offset its fixed positioning) ── */}
      {colourPicker && createPortal(
        <div
          onClick={() => setColourPicker(null)}
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
                <p className={`font-heading text-3xl ${textColor}`}>Change Colour</p>
                <p className={`font-body text-[11px] opacity-50 ${textColor}`}>{colourPicker.swatches.length} options available</p>
              </div>
              <button
                type="button"
                onClick={() => setColourPicker(null)}
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
                {colourPicker.swatches.map((swatch, index) => {
                  const label      = getColourLabel(swatch)
                  const isSelected = colourPicker.colour === label
                  return (
                    <button
                      type="button"
                      key={`${swatch.swatchNo || swatch.name}-${index}`}
                      onClick={() => handleColourChange(swatch)}
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
                        style={bgHex(swatch.hex)}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check size={14} className="text-brand-white drop-shadow-md" />
                          </span>
                        )}
                      </div>
                      <span className={`font-body text-xs leading-tight text-left ${isSelected ? 'text-brand-gold font-semibold' : `${textColor} opacity-80`}`}>
                        {swatch.name}
                        {swatch.swatchNo && <span className="block opacity-60 text-[10px]">No. {swatch.swatchNo}</span>}
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

export default Cart
