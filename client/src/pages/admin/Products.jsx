import { useState, useEffect, useRef } from 'react'
import { Plus, X, ChevronDown, Pencil } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import HoverButton from '../../components/HoverButton'
import ConfirmDialog from '../../components/ConfirmDialog'
import ImageUpload from '../../components/ImageUpload'
import PlayfulLoader from '../../components/PlayfulLoader'
import ColorPicker from '../../components/ColorPicker'
import Select from '../../components/Select'
import { scrollToFirstError } from '../../utils/formScroll'
import api from '../../api/axios'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

// Playful faces shown in place of a missing product image (matches the storefront)
const NO_IMG_FACES = ['>o<', '^_^', '>w<', '^o^']

const ADD_PRODUCT_HOVER  = ['ADD PRODUCT! ^_^', 'NEW ITEM! >O<', "LET'S GO! >W<", 'CREATE! ^O^']
const ADD_PRODUCT_CLICK  = ['OPENING FORM >O<', 'GET READY ^_^', 'HERE WE GO >W<', 'ALMOST! ^O^']
const CANCEL_EDIT_HOVER  = ['CANCEL EDIT! ^_^', 'NEVERMIND! >O<', 'GO BACK! >W<', 'STOP! ^O^']
const CANCEL_EDIT_CLICK  = ['CANCELLING EDIT >O<', 'GOING BACK ^_^', 'OK OK >W<', 'RESETTING ^O^']
const SAVE_HOVER         = ['SAVE IT! ^_^', "LET'S GO! >O<", 'ALMOST! >W<', 'DONE! ^O^']
const CANCEL_HOVER       = ['CANCEL! ^_^', 'NEVERMIND! >O<', 'BACK OUT! >W<', 'NOPE! ^O^']
const CANCEL_CLICK       = ['CANCELLING >O<', 'GOING BACK ^_^', 'OK OK >W<', 'NEVER MIND ^O^']
const ADD_SWATCH_HOVER   = ['ADD! ^_^', 'DROP IT IN! >O<', 'YES! >W<', 'ADD SWATCH! ^O^']
const ADD_SWATCH_CLICK   = ['ADDING >O<', 'POPPING IN ^_^', 'ALMOST! >W<', 'DONE ^O^']
const SAVE_LOADING       = ['SAVING PRODUCT >O<', 'ALMOST DONE ^_^', 'HANG TIGHT >W<', 'JUST A SEC ^O^']
const UPDATE_LOADING     = ['UPDATING PRODUCT >O<', 'ALMOST DONE ^_^', 'SAVING CHANGES >W<', 'JUST A SEC ^O^']

const SUCCESS_MESSAGES = [
  { face: '^_^', text: 'PRODUCT SAVED SUCCESSFULLY!' },
  { face: '>O<', text: 'DONE! NEW PRODUCT ADDED.' },
  { face: '^O^', text: 'SAVED! LOOKING GREAT.' },
  { face: '>W<', text: 'PRODUCT IS LIVE!' },
]

const UPDATE_SUCCESS_MESSAGES = [
  { face: '^_^', text: 'PRODUCT UPDATED!' },
  { face: '>O<', text: 'CHANGES SAVED.' },
  { face: '^O^', text: 'ALL GOOD NOW!' },
  { face: '>W<', text: 'UPDATED SUCCESSFULLY!' },
]

const DELETE_SUCCESS_MESSAGES = [
  { face: '>W<', text: 'PRODUCT DELETED. GONE FOREVER!' },
  { face: '^_^', text: 'POOF! PRODUCT REMOVED.' },
  { face: '>O<', text: 'DELETED! ALL CLEAN NOW.' },
  { face: '^O^', text: 'PRODUCT WIPED OUT. BYE BYE!' },
]

const emptyForm = {
  article: '', title: '', description: '', fabric: '', fit: '',
  category: '', retailPrice: '', wholesalePrice: '', moq: '100',
  image: '', badge: '', stock: '',
  sizes: [],
  swatches: [],
}

const bg = (hex) => ({ backgroundColor: hex })

let swatchKeyCounter = 0
const makeSwatchKey  = () => ++swatchKeyCounter
const tagSwatches    = (swatches) =>
  swatches.map((sw) => sw._key ? sw : { ...sw, _key: makeSwatchKey() })

function Products() {
  const [products, setProducts]             = useState([])
  const [categories, setCategories]         = useState([])
  const [loading, setLoading]               = useState(true)
  const [showForm, setShowForm]             = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData]             = useState(emptyForm)
  const [errors, setErrors]                 = useState({})
  const [shakeFields, setShakeFields]       = useState({})
  const [saving, setSaving]                 = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [serverError, setServerError]       = useState('')
  const [swatchInput, setSwatchInput]       = useState({ name: '', hex: '#000000', swatchNo: '' })
  const [expandedId, setExpandedId]         = useState(null)

  const [confirmOpen, setConfirmOpen]         = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [successMsg, setSuccessMsg]           = useState(null)

  const [newIds, setNewIds]           = useState(new Set())
  const [removingIds, setRemovingIds] = useState(new Set())

  const [enteringSwatchKey, setEnteringSwatchKey]   = useState(null)
  const [removingSwatchKeys, setRemovingSwatchKeys] = useState(new Set())

  const formRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ])
        setProducts(prodRes.data)
        setCategories(catRes.data)
      } catch {
        setServerError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(null), 3200)
    return () => clearTimeout(t)
  }, [successMsg])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    if (serverError) setServerError('')
  }

  const handleNumeric = (e) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '')
    setFormData({ ...formData, [e.target.name]: digitsOnly })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    if (serverError) setServerError('')
  }

  const toggleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const addSwatch = () => {
    if (!swatchInput.name.trim()) return
    const newKey    = makeSwatchKey()
    const newSwatch = { ...swatchInput, name: swatchInput.name.trim(), _key: newKey }
    setFormData((prev) => ({ ...prev, swatches: [...prev.swatches, newSwatch] }))
    setEnteringSwatchKey(newKey)
    setTimeout(() => setEnteringSwatchKey(null), 400)
    setSwatchInput({ name: '', hex: '#000000', swatchNo: '' })
  }

  const removeSwatch = (key) => {
    setRemovingSwatchKeys((prev) => new Set([...prev, key]))
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        swatches: prev.swatches.filter((sw) => sw._key !== key),
      }))
      setRemovingSwatchKeys((prev) => {
        const n = new Set(prev); n.delete(key); return n
      })
    }, 280)
  }

  const validate = () => {
    const e = {}
    if (!formData.article.trim())  e.article        = 'Article no. required'
    if (!formData.title.trim())    e.title          = 'Title required'
    if (!formData.category)        e.category       = 'Category required'
    if (!formData.retailPrice)     e.retailPrice    = 'Retail price required'
    if (!formData.wholesalePrice)  e.wholesalePrice = 'Wholesale price required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setShakeFields(validationErrors)
      scrollToFirstError(validationErrors, { order: ['article', 'title', 'category', 'retailPrice', 'wholesalePrice'] })
      setTimeout(() => setShakeFields({}), 400)
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...formData,
        retailPrice:    Number(formData.retailPrice),
        wholesalePrice: Number(formData.wholesalePrice),
        moq:            Number(formData.moq)   || 100,
        stock:          Number(formData.stock) || 0,
        swatches:       formData.swatches.map(({ _key, ...rest }) => rest),
      }

      if (editingProduct) {
        const { data } = await api.put(`/products/${editingProduct._id}`, payload)
        setProducts((prev) => prev.map((p) => p._id === editingProduct._id ? data : p))
        const msg = UPDATE_SUCCESS_MESSAGES[Math.floor(Math.random() * UPDATE_SUCCESS_MESSAGES.length)]
        setSuccessMsg(msg)
      } else {
        const { data } = await api.post('/products', payload)
        setProducts((prev) => [data, ...prev])
        setNewIds((prev) => new Set([...prev, data._id]))
        setTimeout(() => {
          setNewIds((prev) => { const n = new Set(prev); n.delete(data._id); return n })
        }, 400)
        const msg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]
        setSuccessMsg(msg)
      }

      resetForm()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setSwatchInput({ name: '', hex: '#000000', swatchNo: '' })
    setErrors({})
    setServerError('')
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleEditClick = (product) => {
    setEditingProduct(product)
    setFormData({
      article:        product.article               || '',
      title:          product.title                 || '',
      description:    product.description           || '',
      fabric:         product.fabric                || '',
      fit:            product.fit                   || '',
      category:       product.category?._id || product.category || '',
      retailPrice:    String(product.retailPrice    || ''),
      wholesalePrice: String(product.wholesalePrice || ''),
      moq:            String(product.moq            || '100'),
      image:          product.image                 || '',
      badge:          product.badge                 || '',
      stock:          String(product.stock          || ''),
      sizes:          product.sizes                 || [],
      swatches:       tagSwatches(product.swatches  || []),
    })
    setErrors({})
    setServerError('')
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleDeleteClick = (id) => {
    setPendingDeleteId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setConfirmOpen(false)
    const id = pendingDeleteId
    setRemovingIds((prev) => new Set([...prev, id]))
    setTimeout(async () => {
      try {
        await api.delete(`/products/${id}`)
        setProducts((prev) => prev.filter((p) => p._id !== id))
        setRemovingIds((prev) => { const n = new Set(prev); n.delete(id); return n })
        // ─── playful delete acknowledgement ───
        const msg = DELETE_SUCCESS_MESSAGES[Math.floor(Math.random() * DELETE_SUCCESS_MESSAGES.length)]
        setSuccessMsg(msg)
      } catch {
        setRemovingIds((prev) => { const n = new Set(prev); n.delete(id); return n })
        setServerError('Failed to delete product')
      } finally {
        setPendingDeleteId(null)
      }
    }, 300)
  }

  const handleCancelDelete = () => {
    setConfirmOpen(false)
    setPendingDeleteId(null)
  }

  const inputClass = (field) =>
    [
      'w-full font-body border rounded-lg px-4 py-2 text-brand-black outline-none bg-transparent',
      'focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all duration-300',
      errors[field]      ? 'border-red-500' : 'border-brand-lightgrey',
      shakeFields[field] ? 'shake-error'    : '',
    ].filter(Boolean).join(' ')

  const categoryOptions = categories.map((c) => ({ value: c._id, label: c.name }))

  const productItemClass = (id) => [
    'border border-brand-lightgrey rounded-xl overflow-hidden transition-all duration-300 ease-in-out',
    removingIds.has(id)
      ? 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
      : 'opacity-100 translate-x-0 scale-100',
  ].join(' ')

  const swatchClass = (key) => [
    'flex items-center gap-2 border rounded-lg px-3 py-1.5',
    'transition-all duration-280 ease-in-out',
    enteringSwatchKey === key
      ? 'border-brand-gold/60 scale-105 opacity-100'
      : removingSwatchKeys.has(key)
        ? 'border-red-300 scale-75 opacity-0 -translate-x-2'
        : 'border-brand-lightgrey scale-100 opacity-100',
  ].join(' ')

  const GOLD_BTN  = 'font-body font-semibold px-6 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden'
  const OUTL_BTN  = 'font-body font-semibold px-6 py-3 rounded-lg border-2 border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white transition-all duration-300 active:scale-95 overflow-hidden'

  return (
    <AdminLayout>

      <style>{`
        @keyframes swatchPop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .swatch-enter {
          animation: swatchPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <ConfirmDialog
        isOpen={confirmOpen}
        message="This product will be permanently deleted and cannot be recovered."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-heading text-brand-black">Products</h1>
        <HoverButton
          hoverMessages={editingProduct ? CANCEL_EDIT_HOVER : ADD_PRODUCT_HOVER}
          clickMessages={editingProduct ? CANCEL_EDIT_CLICK : ADD_PRODUCT_CLICK}
          onClick={() => {
            if (editingProduct) { resetForm(); return }
            setShowForm((p) => !p)
          }}
          className={`flex items-center gap-2 self-start sm:self-auto ${GOLD_BTN}`}
        >
          <Plus
            size={18}
            className={`transition-transform duration-300 ${showForm ? 'rotate-45' : 'rotate-0'}`}
          />
          {editingProduct ? 'CANCEL EDIT' : 'ADD PRODUCT'}
        </HoverButton>
      </div>

      {serverError && (
        <p className="text-red-500 font-body text-sm mb-4">{serverError}</p>
      )}

      {/* ─── success / delete acknowledgement toast ─── */}
      <div className={`flex items-center gap-3 mb-4 px-5 py-3 rounded-xl border border-brand-gold/30 bg-brand-gold/5 transition-all duration-500 overflow-hidden ${
        successMsg ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 py-0 mb-0 border-0'
      }`}>
        <span className="text-xl font-body text-brand-gold select-none flex-shrink-0">
          {successMsg?.face}
        </span>
        <p className="font-body text-sm text-brand-black font-medium">
          {successMsg?.text}
        </p>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${
        showForm
          ? 'max-h-none opacity-100 mb-8 overflow-visible'
          : 'max-h-0 opacity-0 mb-0 overflow-hidden'
      }`}>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="border border-brand-lightgrey rounded-xl p-6 flex flex-col gap-5"
        >
          {editingProduct && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-gold/10 border border-brand-gold/30">
              <Pencil size={14} className="text-brand-gold flex-shrink-0" />
              <p className="font-body text-sm text-brand-gold font-medium">
                Editing: {editingProduct.title}
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
              onUploadingChange={setImageUploading}
            />
            <div className="flex-1 flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-body text-sm font-medium text-brand-black mb-2 block">
                    Article No. <span className="text-brand-gold">*</span>
                  </label>
                  <input type="text" name="article" value={formData.article}
                    onChange={handleChange} className={inputClass('article')} />
                  <p className="h-4 text-red-500 text-xs font-body mt-1 leading-4">{errors.article}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="font-body text-sm font-medium text-brand-black mb-2 block">
                    Title <span className="text-brand-gold">*</span>
                  </label>
                  <input type="text" name="title" value={formData.title}
                    onChange={handleChange} className={inputClass('title')} />
                  <p className="h-4 text-red-500 text-xs font-body mt-1 leading-4">{errors.title}</p>
                </div>
              </div>
              <div className="flex-1">
                <label className="font-body text-sm font-medium text-brand-black mb-2 block">
                  Description
                </label>
                <textarea name="description" value={formData.description}
                  onChange={handleChange} rows={4}
                  className="w-full h-32 font-body border border-brand-lightgrey rounded-lg px-4 py-2 text-brand-black outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold resize-none bg-transparent transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div data-field="category">
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">
                Category <span className="text-brand-gold">*</span>
              </label>
              <Select
                options={categoryOptions}
                value={formData.category}
                onChange={(val) => {
                  setFormData({ ...formData, category: val })
                  if (errors.category) setErrors({ ...errors, category: '' })
                }}
                placeholder="Select category"
                error={!!errors.category}
                shake={!!shakeFields.category}
              />
              <p className="h-4 text-red-500 text-xs font-body mt-1 leading-4">{errors.category}</p>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">Fabric</label>
              <input type="text" name="fabric" value={formData.fabric}
                onChange={handleChange} className={inputClass('fabric')} />
              <p className="h-4 mt-1" />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">Fit</label>
              <input type="text" name="fit" value={formData.fit}
                onChange={handleChange} className={inputClass('fit')} />
              <p className="h-4 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">
                Retail (&#8377;) <span className="text-brand-gold">*</span>
              </label>
              <input type="text" inputMode="numeric" name="retailPrice"
                value={formData.retailPrice} onChange={handleNumeric}
                className={inputClass('retailPrice')} />
              <p className="h-4 text-red-500 text-xs font-body mt-1 leading-4">{errors.retailPrice}</p>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">
                Wholesale (&#8377;) <span className="text-brand-gold">*</span>
              </label>
              <input type="text" inputMode="numeric" name="wholesalePrice"
                value={formData.wholesalePrice} onChange={handleNumeric}
                className={inputClass('wholesalePrice')} />
              <p className="h-4 text-red-500 text-xs font-body mt-1 leading-4">{errors.wholesalePrice}</p>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">MOQ</label>
              <input type="text" inputMode="numeric" name="moq"
                value={formData.moq} onChange={handleNumeric} className={inputClass('moq')} />
              <p className="h-4 mt-1" />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">Stock</label>
              <input type="text" inputMode="numeric" name="stock"
                value={formData.stock} onChange={handleNumeric} className={inputClass('stock')} />
              <p className="h-4 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm font-medium text-brand-black mb-2 block">Badge</label>
              <input type="text" name="badge" value={formData.badge}
                onChange={handleChange} placeholder="e.g. New, Bestseller"
                className={inputClass('badge')} />
              <p className="h-4 mt-1" />
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-brand-black mb-3 block">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button key={size} type="button" onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg border-2 font-body text-sm font-semibold transition-all duration-300 active:scale-95 ${
                    formData.sizes.includes(size)
                      ? 'bg-brand-gold border-brand-gold text-brand-white'
                      : 'border-brand-lightgrey text-brand-black hover:border-brand-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-brand-black mb-4 block">
              Colour Swatches
            </label>

            {formData.swatches.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {formData.swatches.map((sw) => (
                  <div
                    key={sw._key}
                    className={swatchClass(sw._key)}
                    style={enteringSwatchKey === sw._key ? { animation: 'swatchPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' } : undefined}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-brand-lightgrey flex-shrink-0"
                      style={bg(sw.hex)}
                    />
                    <span className="font-body text-sm text-brand-black">
                      {sw.name}{sw.swatchNo ? ` #${sw.swatchNo}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSwatch(sw._key)}
                      className="text-brand-black hover:text-red-500 transition-all duration-300 active:scale-90"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-6 items-end">
              <div>
                <label className="font-body text-xs font-medium text-brand-black mb-1 block">Name</label>
                <input
                  type="text"
                  value={swatchInput.name}
                  onChange={(e) => setSwatchInput({ ...swatchInput, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSwatch() } }}
                  className="font-body border border-brand-lightgrey rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-gold text-sm w-36 bg-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-brand-black mb-1 block">Colour</label>
                <ColorPicker
                  value={swatchInput.hex}
                  onChange={(hex) => setSwatchInput({ ...swatchInput, hex })}
                />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-brand-black mb-1 block">Swatch No.</label>
                <input
                  type="text"
                  value={swatchInput.swatchNo}
                  onChange={(e) => setSwatchInput({ ...swatchInput, swatchNo: e.target.value })}
                  className="font-body border border-brand-lightgrey rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-gold text-sm w-24 bg-transparent transition-all duration-300"
                />
              </div>
              <HoverButton
                hoverMessages={ADD_SWATCH_HOVER}
                clickMessages={ADD_SWATCH_CLICK}
                onClick={addSwatch}
                className="flex items-center gap-1 font-body text-sm font-semibold border-2 border-brand-black text-brand-black rounded-lg px-4 py-2 hover:bg-brand-black hover:text-brand-white transition-all duration-300 active:scale-95 overflow-hidden"
              >
                <Plus size={16} /> ADD
              </HoverButton>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <HoverButton
              type="submit"
              hoverMessages={SAVE_HOVER}
              loadingMessages={editingProduct ? UPDATE_LOADING : SAVE_LOADING}
              loading={saving}
              disabled={saving || imageUploading}
              title={imageUploading ? "Wait for image upload to finish" : undefined}
              className={`${GOLD_BTN} w-full sm:w-auto text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100`}
            >
              {editingProduct ? 'UPDATE PRODUCT' : 'SAVE PRODUCT'}
            </HoverButton>
            <HoverButton
              hoverMessages={CANCEL_HOVER}
              clickMessages={CANCEL_CLICK}
              onClick={resetForm}
              className={`${OUTL_BTN} w-full sm:w-auto text-center`}
            >
              CANCEL
            </HoverButton>
          </div>
        </form>
      </div>

      {loading ? (
        <PlayfulLoader variant="admin" />
      ) : products.length === 0 ? (
        <p className="font-body text-brand-black">No products yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product) => (
            <div key={product._id} className={productItemClass(product._id)}>

              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  {product.image ? (
                    <img src={product.image} alt={product.title}
                      className="w-12 h-12 rounded-lg flex-shrink-0 object-cover bg-brand-lightgrey"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-brand-lightgrey flex items-center justify-center">
                      <span className="text-xl select-none text-brand-grey">
                        {NO_IMG_FACES[(product.title?.charCodeAt(0) || 0) % NO_IMG_FACES.length]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-brand-black truncate">{product.title}</p>
                    <p className="font-body text-sm text-brand-grey truncate">
                      {product.category?.name} &middot; &#8377;{product.retailPrice}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => setExpandedId(expandedId === product._id ? null : product._id)}
                    className="p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-90"
                  >
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ${expandedId === product._id ? 'rotate-180' : 'rotate-0'}`}
                    />
                  </button>
                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-75"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product._id)}
                    className="p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-75"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {expandedId === product._id && (
                <div className="px-6 pb-5 border-t border-brand-lightgrey pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 font-body text-sm text-brand-black">
                  <div>
                    <p className="text-brand-grey text-xs uppercase tracking-widest mb-1">Article</p>
                    <p>{product.article || '—'}</p>
                  </div>
                  <div>
                    <p className="text-brand-grey text-xs uppercase tracking-widest mb-1">Wholesale</p>
                    <p>&#8377;{product.wholesalePrice}</p>
                  </div>
                  <div>
                    <p className="text-brand-grey text-xs uppercase tracking-widest mb-1">MOQ</p>
                    <p>{product.moq}</p>
                  </div>
                  <div>
                    <p className="text-brand-grey text-xs uppercase tracking-widest mb-1">Stock</p>
                    <p>{product.stock ?? '—'}</p>
                  </div>
                  {product.fabric && (
                    <div>
                      <p className="text-brand-grey text-xs uppercase tracking-widest mb-1">Fabric</p>
                      <p>{product.fabric}</p>
                    </div>
                  )}
                  {product.fit && (
                    <div>
                      <p className="text-brand-grey text-xs uppercase tracking-widest mb-1">Fit</p>
                      <p>{product.fit}</p>
                    </div>
                  )}
                  {product.badge && (
                    <div>
                      <p className="text-brand-grey text-xs uppercase tracking-widest mb-1">Badge</p>
                      <p>{product.badge}</p>
                    </div>
                  )}
                  {product.sizes?.length > 0 && (
                    <div className="col-span-2 md:col-span-4">
                      <p className="text-brand-grey text-xs uppercase tracking-widest mb-2">Sizes</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((s) => (
                          <span key={s} className="px-2 py-1 rounded-lg border border-brand-lightgrey text-xs font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.swatches?.length > 0 && (
                    <div className="col-span-2 md:col-span-4">
                      <p className="text-brand-grey text-xs uppercase tracking-widest mb-2">Swatches</p>
                      <div className="flex flex-wrap gap-2">
                        {product.swatches.map((sw, i) => (
                          <div key={i} className="flex items-center gap-1.5 border border-brand-lightgrey rounded-lg px-2 py-1">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={bg(sw.hex)} />
                            <span className="text-xs">{sw.name}{sw.swatchNo ? ` #${sw.swatchNo}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

export default Products