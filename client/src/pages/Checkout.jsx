import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Check, QrCode, Truck, Lock, Building2, User, FileText, ArrowLeft } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import HoverButton from '../components/HoverButton'
import { scrollToFirstError } from '../utils/formScroll'
import { isMumbaiPincode } from '../utils/mumbaiPincodes'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api/axios'

const PLACE_HOVER   = ['READY TO ORDER! ^_^', "LET'S DO IT! >O<", 'ALMOST THERE! >W<', 'PLACE ORDER! ^O^']
const PLACE_LOADING = ['PLACING ORDER >O<', 'ALMOST THERE ^_^', 'JUST A SEC >W<', 'HANG TIGHT ^O^']
const SHOP_HOVER    = ['SHOP MORE! ^_^', "LET'S BROWSE! >O<", 'FIND SOMETHING! >W<', "LET'S GO! ^O^"]
const SHOP_LOADING  = ['HEADING THERE >O<', 'LOADING ^_^', 'ONE SEC >W<', 'ALMOST! ^O^']
const ADDR_HOVER    = ['SAVE IT! ^_^', 'KEEP THIS ONE! >O<', 'FOR NEXT TIME! >W<', 'SAVE ADDRESS! ^O^']
const ADDR_LOADING  = ['SAVING >O<', 'KEEPING IT ^_^', 'ONE SEC >W<', 'ALMOST ^O^']
const BIZ_HOVER     = ['CONFIRM ORDER! ^_^', 'GST READY! >O<', 'ALL SET! >W<', 'PLACE ORDER! ^O^']
const BIZ_LOADING   = ['PLACING ORDER >O<', 'FILING GST ^_^', 'JUST A SEC >W<', 'HANG TIGHT ^O^']
const PERSON_HOVER  = ['THAT’S ME! ^_^', 'PERSONAL USE! >O<', 'JUST FOR ME! >W<', "LET'S GO! ^O^"]
const PERSON_LOADING = ['ONE SEC >O<', 'GETTING READY ^_^', 'ALMOST >W<', 'HANG TIGHT ^O^']

function Checkout() {
  const { isDark }  = useTheme()
  const { items, cartTotal, lineTotal, clearCart } = useCart()
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [form, setForm] = useState({
    name:    user?.name  || '',
    email:   user?.email || '',
    phone:   '',
    line1:   '',
    city:    '',
    state:   '',
    pincode: '',
  })
  const [errors, setErrors]           = useState({})
  const [shakeFields, setShakeFields] = useState({})
  const [submitting, setSubmitting]   = useState(false)
  const [serverError, setServerError] = useState('')
  const [shopLoading, setShopLoading] = useState(false)
  const [paymentRef, setPaymentRef]   = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')

  // --- Checkout gating (fetched from the server) ---
  // accepting   : is the store still taking orders (manual-fulfilment cap)?
  // codEligible : may THIS customer use Cash on Delivery (needs 1 past paid
  //               online order)?
  const [accepting, setAccepting]         = useState(true)
  const [codEligible, setCodEligible]     = useState(false)
  const [statusLoaded, setStatusLoaded]   = useState(false)

  // --- Wholesale customer-type flow ---
  // Wholesale orders must declare whether the buyer is a registered business
  // (GST billing, no first-order-COD rule) or an individual (standard rules).
  // customerType : null until chosen, then 'business' | 'individual'
  // typeModal    : which step of the modal is open — null | 'type' | 'gst'
  const [customerType, setCustomerType] = useState(null)
  const [typeModal, setTypeModal]       = useState(null)
  const [gst, setGst] = useState({
    name: '', gstin: '', line1: '', city: '', state: '', pincode: '',
    contactPerson: '', phone: '', email: '',
  })
  const [gstErrors, setGstErrors] = useState({})
  const [gstShake, setGstShake]   = useState({})

  // --- Saved delivery addresses (stored locally, per signed-in customer) ---
  const addrKey = 'khadija_addresses_' + (user?._id || 'guest')
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const raw = localStorage.getItem(addrKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(null)
  const [addrSaved, setAddrSaved]             = useState(false)
  const [savingAddr, setSavingAddr]           = useState(false)
  const [removingIdx, setRemovingIdx]         = useState(null)

  // Re-load saved addresses whenever the storage key changes. This matters
  // because on first render `user` may still be loading (key = ...guest), so a
  // lazy initial read would miss the signed-in customer's saved addresses.
  // Re-reading when addrKey settles ensures they always show up.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(addrKey)
      setSavedAddresses(raw ? JSON.parse(raw) : [])
    } catch {
      setSavedAddresses([])
    }
  }, [addrKey])

  // Fetch checkout gating on mount: whether the store is accepting orders and
  // whether this customer has unlocked Cash on Delivery.
  useEffect(() => {
    let active = true
    const loadStatus = async () => {
      try {
        const { data } = await api.get('/orders/checkout-status')
        if (!active) return
        setAccepting(Boolean(data.accepting))
        setCodEligible(Boolean(data.codEligible))
      } catch {
        // Fail safe: allow online payment, keep COD locked.
        if (active) { setAccepting(true); setCodEligible(false) }
      } finally {
        if (active) setStatusLoaded(true)
      }
    }
    loadStatus()
    return () => { active = false }
  }, [])

  // Free delivery for Mumbai pincodes; elsewhere shipping is billed separately.
  const freeShipping = isMumbaiPincode(form.pincode)
  const total        = cartTotal

  // A wholesale order has at least one line at the bulk (wholesale) rate — i.e.
  // its quantity meets the product's minimum order quantity. Cart items carry
  // moq / wholesalePrice / retailPrice, so we can detect this on the client.
  const isWholesaleOrder = items.some((i) => Number(i.quantity) >= i.moq)

  // COD is selectable when the customer has a past online payment OR this is a
  // wholesale order (a business will confirm GST at checkout; an individual on
  // a wholesale order still falls back to the first-order rule, handled below).
  const codUnlocked = codEligible || isWholesaleOrder

  // If COD is somehow selected while locked, snap back to UPI.
  useEffect(() => {
    if (!codUnlocked && paymentMethod === 'COD') setPaymentMethod('UPI')
  }, [codUnlocked, paymentMethod])

  // Lock background scrolling while the wholesale customer-type / GST modal is
  // open so it stays centred in the viewport (it's portaled to <body>).
  useEffect(() => {
    if (!typeModal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [typeModal])

  const textColor   = isDark ? 'text-brand-white'  : 'text-brand-black'
  const borderColor = isDark ? 'border-brand-white' : 'border-brand-black'
  const inputBase   = isDark
    ? 'border-brand-grey text-brand-white bg-transparent placeholder:text-brand-grey'
    : 'border-brand-lightgrey text-brand-black bg-transparent placeholder:text-brand-grey'

  // --- UPI payment (manual verification) ---
  // The customer scans the QR / pays to this VPA, then enters the transaction
  // reference (UTR) so the admin can verify the payment against their bank.
  const UPI_VPA   = import.meta.env.VITE_UPI_VPA   || 'mohammed.owzzz@oksbi'
  const UPI_PAYEE = import.meta.env.VITE_UPI_PAYEE || 'Khadija Garments'
  const upiLink   = 'upi://' + 'pay?' + [
    `pa=${encodeURIComponent(UPI_VPA)}`,
    `pn=${encodeURIComponent(UPI_PAYEE)}`,
    `am=${encodeURIComponent(Number(total).toFixed(2))}`,
    'cu=INR',
    `tn=${encodeURIComponent('Khadija Garments order')}`,
  ].join('&')

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: '' }))
    if (serverError) setServerError('')
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    clearError(e.target.name)
  }

  const handleLettersOnly = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '')
    setForm((prev) => ({ ...prev, [e.target.name]: val }))
    clearError(e.target.name)
  }

  const handleDigitsOnly = (e, maxLen) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, maxLen)
    setForm((prev) => ({ ...prev, [e.target.name]: val }))
    clearError(e.target.name)
  }

  const persistAddresses = (list) => {
    setSavedAddresses(list)
    try {
      localStorage.setItem(addrKey, JSON.stringify(list))
    } catch {
      /* ignore storage quota errors */
    }
  }

  const applyAddress = (addr, idx) => {
    setForm((prev) => ({
      ...prev,
      name:    addr.name  || prev.name,
      phone:   addr.phone || prev.phone,
      line1:   addr.line1 || '',
      city:    addr.city  || '',
      state:   addr.state || '',
      pincode: addr.pincode || '',
    }))
    setSelectedAddrIdx(idx)
    setErrors({})
    setServerError('')
  }

  const canSaveAddress = Boolean(form.line1.trim() && form.city.trim() && form.pincode.trim())

  const saveCurrentAddress = () => {
    if (!canSaveAddress || savingAddr) return
    setSavingAddr(true)
    // Brief pause so the in-button playful loader is visible, then persist.
    setTimeout(() => {
      const entry = {
        name:    form.name.trim(),
        phone:   form.phone.trim(),
        line1:   form.line1.trim(),
        city:    form.city.trim(),
        state:   form.state.trim(),
        pincode: form.pincode.trim(),
      }
      const exists = savedAddresses.some(
        (a) => a.line1 === entry.line1 && a.pincode === entry.pincode
      )
      if (!exists) persistAddresses([...savedAddresses, entry])
      setSavingAddr(false)
      setAddrSaved(true)
      setTimeout(() => setAddrSaved(false), 2500)
    }, 700)
  }

  const removeSavedAddress = (idx) => {
    if (removingIdx !== null) return
    setRemovingIdx(idx)
    // Let the card play its exit animation before it leaves the list.
    setTimeout(() => {
      const list = savedAddresses.filter((_, i) => i !== idx)
      persistAddresses(list)
      if (selectedAddrIdx === idx) {
        setSelectedAddrIdx(null)
      } else if (selectedAddrIdx !== null && selectedAddrIdx > idx) {
        // Keep the same card highlighted after one before it is removed.
        setSelectedAddrIdx(selectedAddrIdx - 1)
      }
      setRemovingIdx(null)
    }, 320)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name = 'Full name is required'
    if (!form.email.trim()) {
      e.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Enter a valid email address'
    }
    if (!form.phone.trim()) {
      e.phone = 'Phone number is required'
    } else if (form.phone.length !== 10) {
      e.phone = 'Enter a valid 10-digit number'
    }
    if (!form.line1.trim())   e.line1   = 'Address is required'
    if (!form.city.trim())    e.city    = 'City is required'
    if (!form.state.trim())   e.state   = 'State is required'
    if (!form.pincode.trim()) {
      e.pincode = 'Pincode is required'
    } else if (form.pincode.length !== 6) {
      e.pincode = 'Enter a valid 6-digit pincode'
    }
    // UPI orders must carry a transaction reference; COD does not.
    if (paymentMethod === 'UPI') {
      if (!paymentRef.trim()) {
        e.paymentRef = 'Enter the UPI reference / UTR after paying'
      } else if (paymentRef.trim().length < 6) {
        e.paymentRef = 'Reference looks too short — check your UPI app'
      }
    }
    return e
  }

  // Build and submit the order. `type` is 'individual' | 'business'; `bizData`
  // carries the GST details for business orders (ignored otherwise).
  const placeOrder = async (type, bizData) => {
    setSubmitting(true)
    setServerError('')
    try {
      const payload = {
        customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
        address:  { line1: form.line1.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim() },
        items: items.map((item) => ({
          id: item.id, title: item.title, size: item.size,
          colour: item.colour, colourHex: item.colourHex,
          quantity: Number(item.quantity),
        })),
        paymentMethod,
        paymentRef: paymentMethod === 'UPI' ? paymentRef.trim() : '',
        user: user?._id || null,
        customerType: type || 'individual',
        business: type === 'business' ? bizData : undefined,
      }
      const { data } = await api.post('/orders', payload)
      clearCart()
      navigate('/order-confirmation', { state: { order: data } })
    } catch (err) {
      setTypeModal(null)
      setServerError(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!accepting) {
      setServerError("We're currently not accepting new orders. Please check back soon!")
      return
    }
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setShakeFields(validationErrors)
      scrollToFirstError(validationErrors, { order: ['name', 'email', 'phone', 'line1', 'city', 'state', 'pincode', 'paymentRef'] })
      setTimeout(() => setShakeFields({}), 400)
      return
    }
    // Wholesale orders must declare business vs individual before placing.
    if (isWholesaleOrder) {
      setGstErrors({})
      setTypeModal('type')
      return
    }
    // Retail orders place straight away under the standard rules.
    placeOrder('individual', null)
  }

  // --- Customer-type modal handlers ---
  const chooseIndividual = () => {
    setCustomerType('individual')
    // Individuals fall under the standard first-order-COD rule. If COD was
    // selected (unlocked because the order is wholesale) but they haven't paid
    // online before, switch them to Pay Online and explain why.
    if (paymentMethod === 'COD' && !codEligible) {
      setTypeModal(null)
      setPaymentMethod('UPI')
      setServerError('As an individual, Cash on Delivery unlocks after your first online payment. Please pay online to place this order, then add the UPI reference. ^_^')
      return
    }
    setTypeModal(null)
    placeOrder('individual', null)
  }

  const chooseBusiness = () => {
    setCustomerType('business')
    setTypeModal('gst')
  }

  const handleGstChange = (field, value) => {
    setGst((prev) => ({ ...prev, [field]: value }))
    setGstErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateGst = () => {
    const e = {}
    if (!gst.name.trim()) e.name = 'Business name is required'
    const gstin = gst.gstin.trim().toUpperCase()
    if (!gstin) {
      e.gstin = 'GSTIN is required'
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
      e.gstin = 'Enter a valid 15-character GSTIN'
    }
    if (!gst.line1.trim()) e.line1 = 'Business address is required'
    if (!gst.city.trim())  e.city  = 'City is required'
    if (!gst.state.trim()) e.state = 'State is required'
    if (!gst.pincode.trim()) {
      e.pincode = 'Pincode is required'
    } else if (gst.pincode.trim().length !== 6) {
      e.pincode = 'Enter a valid 6-digit pincode'
    }
    if (gst.phone.trim() && gst.phone.trim().length !== 10) {
      e.phone = 'Enter a valid 10-digit number'
    }
    if (gst.email.trim() && !/\S+@\S+\.\S+/.test(gst.email)) {
      e.email = 'Enter a valid email address'
    }
    return e
  }

  const submitBusiness = () => {
    const e = validateGst()
    if (Object.keys(e).length > 0) {
      setGstErrors(e)
      setGstShake(e)
      scrollToFirstError(e, {
        order: ['name', 'gstin', 'line1', 'city', 'state', 'pincode', 'phone', 'email'],
        container: document.getElementById('ck-gst-fields'),
      })
      setTimeout(() => setGstShake({}), 400)
      return
    }
    const details = {
      name:          gst.name.trim(),
      gstin:         gst.gstin.trim().toUpperCase(),
      line1:         gst.line1.trim(),
      city:          gst.city.trim(),
      state:         gst.state.trim(),
      pincode:       gst.pincode.trim(),
      contactPerson: gst.contactPerson.trim(),
      phone:         gst.phone.trim(),
      email:         gst.email.trim(),
    }
    placeOrder('business', details)
  }

  const closeModal = () => {
    if (submitting) return
    setTypeModal(null)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-24 flex flex-col items-center gap-6">
        <p className={`font-body transition-colors duration-500 ${textColor}`}>Your cart is empty.</p>
        <HoverButton
          hoverMessages={SHOP_HOVER}
          loadingMessages={SHOP_LOADING}
          loading={shopLoading}
          onClick={() => { setShopLoading(true); setTimeout(() => navigate('/catalogue'), 1000) }}
          className="font-body font-semibold px-8 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95"
        >
          CONTINUE SHOPPING
        </HoverButton>
      </div>
    )
  }

  // Store is at capacity — block ordering with a friendly message.
  if (statusLoaded && !accepting) {
    return (
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-24 flex flex-col items-center text-center gap-6">
        <span className="text-5xl select-none">-_-</span>
        <h1 className={`text-4xl font-heading transition-colors duration-500 ${textColor}`}>Currently Not Accepting Orders</h1>
        <p className={`font-body max-w-md opacity-70 transition-colors duration-500 ${textColor}`}>
          We're packing and delivering a full batch of orders right now, so we've paused new ones for a little while to make sure every order gets our full care. Please check back soon — thank you for your patience! ^_^
        </p>
        <HoverButton
          hoverMessages={SHOP_HOVER}
          loadingMessages={SHOP_LOADING}
          loading={shopLoading}
          onClick={() => { setShopLoading(true); setTimeout(() => navigate('/catalogue'), 1000) }}
          className="font-body font-semibold px-8 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95"
        >
          BACK TO CATALOGUE
        </HoverButton>
      </div>
    )
  }

  const fieldClass = (field) =>
    [
      'w-full font-body rounded-lg px-4 py-3 border-2 outline-none transition-all duration-300',
      'focus:border-brand-gold focus:ring-1 focus:ring-brand-gold',
      inputBase,
      errors[field]      ? 'border-red-500' : '',
      shakeFields[field] ? 'shake-error'    : '',
    ].filter(Boolean).join(' ')

  // Same input styling for the GST modal fields, driven by its own error state.
  const gstFieldClass = (field) =>
    [
      'w-full font-body rounded-lg px-4 py-2.5 border-2 outline-none transition-all duration-300',
      'focus:border-brand-gold focus:ring-1 focus:ring-brand-gold',
      inputBase,
      gstErrors[field] ? 'border-red-500' : '',
      gstShake[field]  ? 'shake-error'    : '',
    ].filter(Boolean).join(' ')

  const methodClass = (active, disabled) =>
    [
      'relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-300',
      disabled
        ? 'border-brand-lightgrey opacity-50 cursor-not-allowed'
        : active
          ? 'border-brand-gold bg-brand-gold/5 cursor-pointer active:scale-[0.98]'
          : isDark
            ? 'border-brand-grey hover:border-brand-white cursor-pointer active:scale-[0.98]'
            : 'border-brand-lightgrey hover:border-brand-black cursor-pointer active:scale-[0.98]',
      textColor,
    ].join(' ')

  const ErrRow = ({ field }) => (
    <p className="h-4 mt-1 text-red-500 text-xs font-body leading-4">{errors[field] || ''}</p>
  )

  const GstErr = ({ field }) => (
    <p className="h-4 mt-1 text-red-500 text-xs font-body leading-4">{gstErrors[field] || ''}</p>
  )

  const Label = ({ children, required }) => (
    <label className={`font-body text-sm font-medium mb-1.5 block transition-colors duration-500 ${textColor}`}>
      {children}{required && <span className="text-brand-gold ml-0.5">*</span>}
    </label>
  )

  const GstLabel = ({ children, required }) => (
    <label className={`font-body text-xs font-medium mb-1 block transition-colors duration-500 ${textColor}`}>
      {children}{required && <span className="text-brand-gold ml-0.5">*</span>}
    </label>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">

      <style>{`
        @keyframes ckBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        .ck-backdrop-in { animation: ckBackdropIn 0.25s ease both; }
        @keyframes ckModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0);       }
        }
        .ck-modal-in { animation: ckModalIn 0.24s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes ckStepIn {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        .ck-step-in { animation: ckStepIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <h1 className={`text-5xl font-heading mb-12 transition-colors duration-500 ${textColor}`}>Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <form onSubmit={handleSubmit} noValidate className="lg:col-span-2 flex flex-col gap-8">

          {/* Wholesale heads-up: we'll ask business vs individual on placing. */}
          {isWholesaleOrder && (
            <div className="rounded-xl border-2 border-brand-gold/40 bg-brand-gold/5 px-4 py-3 flex items-start gap-3 animate-fade-up">
              <Building2 size={20} className="flex-shrink-0 text-brand-gold mt-0.5" />
              <p className={`font-body text-xs leading-relaxed transition-colors duration-500 ${textColor}`}>
                This looks like a wholesale order ^_^ When you place it, we'll ask whether you're ordering as a business (for GST billing) or as an individual.
              </p>
            </div>
          )}

          <section>
            <h2 className={`font-heading text-2xl mb-5 transition-colors duration-500 ${textColor}`}>Contact Details</h2>
            <div className="flex flex-col gap-2">
              <div>
                <Label required>Full Name</Label>
                <input type="text" name="name" value={form.name}
                  onChange={handleLettersOnly} placeholder="e.g. Riya Shaikh"
                  autoComplete="name" className={fieldClass('name')} />
                <ErrRow field="name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Email</Label>

                                    <input type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="e.g. riya@email.com"
                    autoComplete="email" className={fieldClass('email')} />
                  <ErrRow field="email" />
                </div>
                <div>
                  <Label required>Phone</Label>
                  <input type="text" inputMode="numeric" name="phone"
                    maxLength={10} value={form.phone}
                    onChange={(e) => handleDigitsOnly(e, 10)}
                    placeholder="10-digit number" autoComplete="tel"
                    className={fieldClass('phone')} />
                  <ErrRow field="phone" />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className={`font-heading text-2xl mb-5 transition-colors duration-500 ${textColor}`}>Delivery Address</h2>

            <div className={`grid transition-all duration-500 ease-out ${savedAddresses.length > 0 ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
              <div className="overflow-hidden min-h-0">
                <p className={`font-body text-sm font-medium mb-3 transition-colors duration-500 ${textColor}`}>
                  Use a saved address
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr, idx) => {
                    const active = selectedAddrIdx === idx
                    return (
                      <div
                        key={idx}
                        onClick={() => applyAddress(addr, idx)}
                        className={[
                          'relative cursor-pointer rounded-xl border-2 p-4 pr-9 transition-all duration-300 active:scale-[0.98] animate-fade-up',
                          removingIdx === idx ? 'opacity-0 scale-90 pointer-events-none' : '',
                          active
                            ? 'border-brand-gold bg-brand-gold/5'
                            : isDark
                              ? 'border-brand-grey hover:border-brand-white'
                              : 'border-brand-lightgrey hover:border-brand-black',
                        ].join(' ')}
                      >
                        <p className={`font-body text-sm font-semibold transition-colors duration-500 ${textColor}`}>
                          {addr.name || 'Saved address'}
                        </p>
                        <p className={`font-body text-xs mt-1 leading-relaxed opacity-70 transition-colors duration-500 ${textColor}`}>
                          {addr.line1}, {addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.pincode}
                        </p>
                        {addr.phone && (
                          <p className={`font-body text-xs mt-0.5 opacity-60 transition-colors duration-500 ${textColor}`}>
                            {addr.phone}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeSavedAddress(idx) }}
                          aria-label="Remove saved address"
                          className="absolute top-3 right-3 text-brand-grey hover:text-red-500 transition-all duration-300 active:scale-90"
                        >
                          <X size={15} />
                        </button>
                        {active && (
                          <span className="absolute bottom-3 right-3 text-brand-gold">
                            <Check size={15} />
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <Label required>Address Line</Label>
                <input type="text" name="line1" value={form.line1}
                  onChange={handleChange} placeholder="House / flat / street"
                  autoComplete="street-address" className={fieldClass('line1')} />
                <ErrRow field="line1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label required>City</Label>
                  <input type="text" name="city" value={form.city}
                    onChange={handleLettersOnly} placeholder="e.g. Mumbai"
                    autoComplete="address-level2" className={fieldClass('city')} />
                  <ErrRow field="city" />
                </div>
                <div>
                  <Label required>State</Label>
                  <input type="text" name="state" value={form.state}
                    onChange={handleLettersOnly} placeholder="e.g. Maharashtra"
                    autoComplete="address-level1" className={fieldClass('state')} />
                  <ErrRow field="state" />
                </div>
                <div>
                  <Label required>Pincode</Label>
                  <input type="text" inputMode="numeric" name="pincode"
                    maxLength={6} value={form.pincode}
                    onChange={(e) => handleDigitsOnly(e, 6)}
                    placeholder="6-digit code" autoComplete="postal-code"
                    className={fieldClass('pincode')} />
                  <ErrRow field="pincode" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <HoverButton
                  hoverMessages={ADDR_HOVER}
                  loadingMessages={ADDR_LOADING}
                  loading={savingAddr}
                  onClick={saveCurrentAddress}
                  disabled={!canSaveAddress}
                  className={[
                    'font-body text-xs font-semibold px-4 py-2 rounded-lg border-2 transition-all duration-300 active:scale-95 overflow-hidden',
                    canSaveAddress
                      ? isDark
                        ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                        : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                      : 'border-brand-lightgrey text-brand-grey opacity-60 cursor-not-allowed',
                  ].join(' ')}
                >
                  SAVE THIS ADDRESS
                </HoverButton>
                {addrSaved && (
                  <span className="font-body text-xs font-medium text-brand-gold animate-pop inline-block">
                    ^_^ Address saved for next time!
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className={`border-2 rounded-xl p-6 transition-colors duration-500 ${borderColor}`}>
            <h2 className={`font-heading text-2xl mb-1 transition-colors duration-500 ${textColor}`}>Payment</h2>
            <p className={`font-body text-sm opacity-70 mb-5 transition-colors duration-500 ${textColor}`}>
              Choose how you'd like to pay for this order.
            </p>

            {/* Payment method selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={methodClass(paymentMethod === 'UPI', false)}
              >
                <QrCode size={22} className="flex-shrink-0 text-brand-gold" />
                <div className="text-left">
                  <p className="font-body font-semibold text-sm">Pay Online (UPI)</p>
                  <p className="font-body text-xs opacity-60">Scan &amp; pay instantly</p>
                </div>
                {paymentMethod === 'UPI' && (
                  <span className="absolute top-2.5 right-2.5 text-brand-gold"><Check size={16} /></span>
                )}
              </button>

              <button
                type="button"
                disabled={!codUnlocked}
                onClick={() => { if (codUnlocked) setPaymentMethod('COD') }}
                className={methodClass(paymentMethod === 'COD', !codUnlocked)}
              >
                {codUnlocked
                  ? <Truck size={22} className="flex-shrink-0 text-brand-gold" />
                  : <Lock size={22} className="flex-shrink-0" />}
                <div className="text-left">
                  <p className="font-body font-semibold text-sm">Cash on Delivery</p>
                  <p className="font-body text-xs opacity-60">
                    {codUnlocked
                      ? (isWholesaleOrder && !codEligible ? 'For business (GST) orders' : 'Pay when it arrives')
                      : 'Unlocks after 1st online order'}
                  </p>
                </div>
                {paymentMethod === 'COD' && (
                  <span className="absolute top-2.5 right-2.5 text-brand-gold"><Check size={16} /></span>
                )}
              </button>
            </div>

            {/* Grid-stack: an invisible copy of the longest hint always reserves
                the row height, so the note never resizes the card. */}
            <div className="grid mb-5">
              <p aria-hidden="true" className="col-start-1 row-start-1 invisible font-body text-xs">
                First order? Please pay online. Cash on Delivery unlocks automatically once your first online payment is confirmed.
              </p>
              <p className="col-start-1 row-start-1 font-body text-xs text-brand-gold">
                {!codUnlocked
                  ? 'First order? Please pay online. Cash on Delivery unlocks automatically once your first online payment is confirmed. ^_^'
                  : (isWholesaleOrder && !codEligible
                      ? 'Ordering for a business? You can choose Cash on Delivery — just confirm your GST details when you place the order. ^_^'
                      : '')}
              </p>
            </div>

            {/* Payment detail region. Both blocks stay mounted and use the
                site's standard grid-rows accordion (grid-rows-[0fr] <-> [1fr]
                with overflow-hidden), so switching methods animates the height
                SMOOTHLY instead of jumping, and fades the content in/out. This
                removes the element shift and adds a consistent transition. */}
            <div
              className={`grid transition-all duration-500 ease-out ${
                paymentMethod === 'UPI'
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden min-h-0">
                <div className={paymentMethod === 'UPI' ? 'animate-fade-up' : ''}>
                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    <div className="bg-white p-3 rounded-xl border-2 border-brand-lightgrey flex-shrink-0 mx-auto sm:mx-0">
                      <QRCodeSVG value={upiLink} size={160} level="M" />
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                      <div>
                        <p className={`font-body text-xs uppercase tracking-widest opacity-60 mb-1 transition-colors duration-500 ${textColor}`}>Amount to pay</p>
                        <p className="font-body font-bold text-2xl text-brand-gold">&#8377;{total}</p>
                      </div>
                      <div>
                        <p className={`font-body text-xs uppercase tracking-widest opacity-60 mb-1 transition-colors duration-500 ${textColor}`}>UPI ID</p>
                        <p className={`font-body font-semibold text-sm break-all transition-colors duration-500 ${textColor}`}>{UPI_VPA}</p>
                      </div>
                      <a
                        href={upiLink}
                        className="sm:hidden font-body text-xs font-semibold text-center px-4 py-2.5 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95"
                      >
                        OPEN UPI APP
                      </a>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Label required>UPI Reference / UTR Number</Label>
                    <input
                      type="text"
                      name="paymentRef"
                      value={paymentRef}
                      onChange={(e) => { setPaymentRef(e.target.value); clearError('paymentRef') }}
                      placeholder="e.g. 419312345678 (from your UPI app)"
                      className={fieldClass('paymentRef')}
                    />
                    <ErrRow field="paymentRef" />
                    <p className={`font-body text-xs opacity-60 transition-colors duration-500 ${textColor}`}>
                      After paying, copy the transaction / reference ID your UPI app shows and paste it here so we can verify your payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`grid transition-all duration-500 ease-out ${
                paymentMethod === 'COD'
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden min-h-0">
                <div className={`rounded-xl border-2 border-brand-lightgrey p-5 flex items-start gap-3 ${paymentMethod === 'COD' ? 'animate-fade-up' : ''}`}>
                  <Truck size={22} className="flex-shrink-0 text-brand-gold mt-0.5" />
                  <div>
                    <p className={`font-body font-semibold text-sm transition-colors duration-500 ${textColor}`}>Cash on Delivery selected</p>
                    <p className={`font-body text-xs opacity-70 mt-1 leading-relaxed transition-colors duration-500 ${textColor}`}>
                      Please keep &#8377;{total} ready in cash. You'll pay the delivery agent directly when your order arrives. No advance payment needed. ^_^
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <p className="h-5 text-red-500 font-body text-sm leading-5">{serverError || ''}</p>

          <HoverButton
            type="submit"
            hoverMessages={PLACE_HOVER}
            loadingMessages={PLACE_LOADING}
            loading={submitting}
            className="w-full bg-brand-gold text-brand-white font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-4 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden"
          >
            PLACE ORDER
          </HoverButton>
        </form>

        {/* Order Summary */}
        <div className={`border-2 rounded-xl p-6 h-fit transition-colors duration-500 ${borderColor}`}>
          <h2 className={`font-heading text-2xl mb-6 transition-colors duration-500 ${textColor}`}>Order Summary</h2>
          <div className="flex flex-col gap-4 mb-6">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}-${item.colour}`} className="flex gap-3">
                {item.image && (
                  <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-brand-lightgrey overflow-hidden"
                    style={{ backgroundImage: `url(${item.image})`, backgroundSize: '200% 100%', backgroundPosition: 'left center' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm font-semibold leading-snug transition-colors duration-500 ${textColor}`}>{item.title}</p>
                  <p className={`font-body text-xs mt-0.5 opacity-70 transition-colors duration-500 ${textColor}`}>
                    {item.size}{item.colour ? ` · ${item.colour}` : ''} × {item.quantity}
                  </p>
                  <p className="font-body text-xs text-brand-gold font-semibold mt-0.5">&#8377;{lineTotal(item)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={`border-t pt-4 transition-colors duration-500 ${borderColor}`}>
            <div className={`flex justify-between font-body text-sm mb-2 transition-colors duration-500 ${textColor}`}>
              <span>Subtotal</span><span>&#8377;{cartTotal}</span>
            </div>
            <div className={`flex justify-between font-body text-sm mb-1 transition-colors duration-500 ${textColor}`}>
              <span>Shipping</span>
              {cartTotal > 0 && freeShipping
                ? <span className="font-semibold text-brand-gold">FREE</span>
                : <span className="font-semibold text-brand-gold">Extra*</span>}
            </div>
            {/* Grid-stack: an invisible copy of the LONGEST message always
                reserves the row height, so switching between the free-delivery
                and paid-shipping text never resizes the summary card. */}
            <div className="grid mb-4">
              <p aria-hidden="true" className="col-start-1 row-start-1 invisible font-body text-xs">
                *Shipping charges billed separately, payable on delivery
              </p>
              <p className="col-start-1 row-start-1 font-body text-xs text-brand-gold">
                {cartTotal > 0 && freeShipping
                  ? 'Free delivery within Mumbai ^_^'
                  : '*Shipping charges billed separately, payable on delivery'}
              </p>
            </div>
            <div className={`flex justify-between font-body font-bold text-lg transition-colors duration-500 ${textColor}`}>
              <span>Total</span><span className="text-brand-gold">&#8377;{total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHOLESALE CUSTOMER-TYPE / GST MODAL (portaled to <body>) ── */}
      {typeModal && createPortal(
        <div
          onClick={closeModal}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6 ck-backdrop-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`ck-modal-in relative w-full max-w-lg rounded-2xl flex flex-col max-h-[90vh] ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
          >
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <div className="min-w-0">
                <p className={`font-heading text-3xl leading-tight ${textColor}`}>
                  {typeModal === 'type' ? 'Almost There!' : 'Business / GST Details'}
                </p>
                <p className={`font-body text-[11px] opacity-50 ${textColor}`}>
                  {typeModal === 'type'
                    ? 'How are you ordering this wholesale lot?'
                    : 'Required for your GST tax invoice'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close"
                className={`flex-shrink-0 border-2 rounded-lg p-1.5 transition-all duration-300 active:scale-90 disabled:opacity-40 ${
                  isDark
                    ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                    : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                }`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              {typeModal === 'type' ? (
                <div className="ck-step-in flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={chooseBusiness}
                    className={`group text-left rounded-xl border-2 p-5 flex items-start gap-4 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${
                      isDark ? 'border-brand-grey hover:border-brand-gold' : 'border-brand-lightgrey hover:border-brand-gold'
                    }`}
                  >
                    <span className="flex-shrink-0 w-11 h-11 rounded-full bg-brand-gold/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Building2 size={22} className="text-brand-gold" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block font-body font-semibold text-sm ${textColor}`}>I'm a Business (GST)</span>
                      <span className={`block font-body text-xs opacity-60 mt-1 leading-relaxed ${textColor}`}>
                        Get a GST tax invoice and unlock Cash on Delivery — no first-order restriction.
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={chooseIndividual}
                    className={`group text-left rounded-xl border-2 p-5 flex items-start gap-4 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${
                      isDark ? 'border-brand-grey hover:border-brand-gold' : 'border-brand-lightgrey hover:border-brand-gold'
                    }`}
                  >
                    <span className="flex-shrink-0 w-11 h-11 rounded-full bg-brand-gold/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <User size={22} className="text-brand-gold" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block font-body font-semibold text-sm ${textColor}`}>I'm an Individual</span>
                      <span className={`block font-body text-xs opacity-60 mt-1 leading-relaxed ${textColor}`}>
                        Personal use. Cash on Delivery unlocks after your first online payment.
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <div id="ck-gst-fields" className="ck-step-in flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-brand-gold flex-shrink-0" />
                    <p className={`font-body text-xs opacity-70 leading-relaxed ${textColor}`}>
                      Enter your registered business details exactly as on your GST certificate.
                    </p>
                  </div>

                  <div>
                    <GstLabel required>Business / Legal Name</GstLabel>
                    <input
                      type="text"
                      value={gst.name}
                      data-field="name"
                      onChange={(e) => handleGstChange('name', e.target.value)}
                      placeholder="e.g. Riya Textiles Pvt Ltd"
                      className={gstFieldClass('name')}
                    />
                    <GstErr field="name" />
                  </div>

                  <div>
                    <GstLabel required>GSTIN</GstLabel>
                    <input
                      type="text"
                      value={gst.gstin}
                      data-field="gstin"
                      onChange={(e) => handleGstChange('gstin', e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15))}
                      placeholder="15-character GSTIN"
                      className={`${gstFieldClass('gstin')} tracking-wider`}
                    />
                    <GstErr field="gstin" />
                  </div>

                  <div>
                    <GstLabel required>Business Address</GstLabel>
                    <input
                      type="text"
                      value={gst.line1}
                      data-field="line1"
                      onChange={(e) => handleGstChange('line1', e.target.value)}
                      placeholder="Shop / office / street"
                      className={gstFieldClass('line1')}
                    />
                    <GstErr field="line1" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <div>
                      <GstLabel required>City</GstLabel>
                      <input
                        type="text"
                        value={gst.city}
                        data-field="city"
                        onChange={(e) => handleGstChange('city', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        placeholder="e.g. Mumbai"
                        className={gstFieldClass('city')}
                      />
                      <GstErr field="city" />
                    </div>
                    <div>
                      <GstLabel required>State</GstLabel>
                      <input
                        type="text"
                        value={gst.state}
                        data-field="state"
                        onChange={(e) => handleGstChange('state', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        placeholder="e.g. Maharashtra"
                        className={gstFieldClass('state')}
                      />
                      <GstErr field="state" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <div>
                      <GstLabel required>Pincode</GstLabel>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={gst.pincode}
                        data-field="pincode"
                        onChange={(e) => handleGstChange('pincode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        className={gstFieldClass('pincode')}
                      />
                      <GstErr field="pincode" />
                    </div>
                    <div>
                      <GstLabel>Business Phone</GstLabel>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={gst.phone}
                        data-field="phone"
                        onChange={(e) => handleGstChange('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                        placeholder="Optional"
                        className={gstFieldClass('phone')}
                      />
                      <GstErr field="phone" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <div>
                      <GstLabel>Contact Person</GstLabel>
                      <input
                        type="text"
                        value={gst.contactPerson}
                        onChange={(e) => handleGstChange('contactPerson', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        placeholder="Optional"
                        className={gstFieldClass('contactPerson')}
                      />
                      <GstErr field="contactPerson" />
                    </div>
                    <div>
                      <GstLabel>Business Email</GstLabel>
                      <input
                        type="email"
                        value={gst.email}
                        data-field="email"
                        onChange={(e) => handleGstChange('email', e.target.value)}
                        placeholder="Optional"
                        className={gstFieldClass('email')}
                      />
                      <GstErr field="email" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => { if (!submitting) setTypeModal('type') }}
                      disabled={submitting}
                      className={`flex-shrink-0 flex items-center gap-1.5 font-body text-xs font-semibold px-4 py-3 rounded-lg border-2 transition-all duration-300 active:scale-95 disabled:opacity-40 ${
                        isDark
                          ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black'
                          : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'
                      }`}
                    >
                      <ArrowLeft size={14} /> BACK
                    </button>
                    <HoverButton
                      hoverMessages={BIZ_HOVER}
                      loadingMessages={BIZ_LOADING}
                      loading={submitting}
                      onClick={submitBusiness}
                      className="flex-1 flex items-center justify-center bg-brand-gold text-brand-white font-body font-semibold text-sm tracking-widest uppercase rounded-lg px-6 py-3 transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-90 overflow-hidden"
                    >
                      PLACE ORDER
                    </HoverButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Checkout