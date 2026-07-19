import { useState, useEffect, useRef } from 'react'
import { Plus, X, Pencil, Check } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import HoverButton from '../../components/HoverButton'
import ConfirmDialog from '../../components/ConfirmDialog'
import PlayfulLoader from '../../components/PlayfulLoader'
import api from '../../api/axios'

const ADD_HOVER    = ['ADD CATEGORY! ^_^', 'CREATE! >O<', "LET'S GO! >W<", 'NEW CAT! ^O^']
const ADD_CLICK    = ['OPENING FORM >O<', 'GET READY ^_^', 'HERE WE GO >W<', 'ALMOST! ^O^']
const SAVE_HOVER   = ['SAVE IT! ^_^', "LET'S GO! >O<", 'ALMOST! >W<', 'DONE! ^O^']
const SAVE_CLICK   = ['SAVING CATEGORY >O<', 'ALMOST DONE ^_^', 'HANG TIGHT >W<', 'JUST A SEC ^O^']

const SUCCESS_MESSAGES = [
  { face: '^_^', text: 'CATEGORY SAVED SUCCESSFULLY!' },
  { face: '>O<', text: 'DONE! NEW CATEGORY ADDED.' },
  { face: '^O^', text: 'SAVED! LOOKING GOOD.' },
  { face: '>W<', text: 'CATEGORY IS LIVE!' },
]

const UPDATE_SUCCESS_MESSAGES = [
  { face: '^_^', text: 'CATEGORY UPDATED!' },
  { face: '>O<', text: 'NAME CHANGED!' },
  { face: '^O^', text: 'ALL GOOD NOW!' },
  { face: '>W<', text: 'UPDATED SUCCESSFULLY!' },
]

const DELETE_SUCCESS_MESSAGES = [
  { face: '>W<', text: 'CATEGORY DELETED. GONE FOREVER!' },
  { face: '^_^', text: 'POOF! CATEGORY REMOVED.' },
  { face: '>O<', text: 'DELETED! ALL CLEAN NOW.' },
  { face: '^O^', text: 'CATEGORY WIPED OUT. BYE BYE!' },
]

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [name, setName]             = useState('')
  const [error, setError]           = useState('')
  const [shake, setShake]           = useState(false)
  const [saving, setSaving]         = useState(false)

  const [editingId, setEditingId]   = useState(null)
  const [editName, setEditName]     = useState('')
  const [editError, setEditError]   = useState('')
  const [editShake, setEditShake]   = useState(false)
  const [updating, setUpdating]     = useState(false)
  const editInputRef                = useRef(null)

  const [animBtn, setAnimBtn]       = useState(null)

  const [confirmOpen, setConfirmOpen]         = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [successMsg, setSuccessMsg]           = useState(null)

  const [newIds, setNewIds]           = useState(new Set())
  const [removingIds, setRemovingIds] = useState(new Set())

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories')
      setCategories(data)
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(null), 3200)
    return () => clearTimeout(t)
  }, [successMsg])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const fireAnim = (btn, callback) => {
    setAnimBtn(btn)
    setTimeout(() => setAnimBtn(null), 300)
    callback()
  }

  const handleChange = (e) => {
    setName(e.target.value)
    if (error) setError('')
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  const triggerEditShake = () => {
    setEditShake(true)
    setTimeout(() => setEditShake(false), 400)
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Category name is required')
      triggerShake()
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post('/categories', { name })
      setCategories((prev) => [data, ...prev])
      setNewIds((prev) => new Set([...prev, data._id]))
      setTimeout(() => {
        setNewIds((prev) => { const n = new Set(prev); n.delete(data._id); return n })
      }, 400)
      setName('')
      setError('')
      setShowForm(false)
      const msg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]
      setSuccessMsg(msg)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category')
      triggerShake()
    } finally {
      setSaving(false)
    }
  }

  const handleEditStart = (category) => {
    setEditingId(category._id)
    setEditName(category.name)
    setEditError('')
    setAnimBtn(null)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditName('')
    setEditError('')
    setAnimBtn(null)
  }

  const handleEditSave = async (id) => {
    if (!editName.trim()) {
      setEditError('Name required')
      triggerEditShake()
      return
    }
    setUpdating(true)
    try {
      const { data } = await api.put(`/categories/${id}`, { name: editName.trim() })
      setCategories((prev) => prev.map((c) => c._id === id ? data : c))
      setEditingId(null)
      setEditName('')
      setAnimBtn(null)
      const msg = UPDATE_SUCCESS_MESSAGES[Math.floor(Math.random() * UPDATE_SUCCESS_MESSAGES.length)]
      setSuccessMsg(msg)
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update')
      triggerEditShake()
    } finally {
      setUpdating(false)
    }
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
        await api.delete(`/categories/${id}`)
        setCategories((prev) => prev.filter((c) => c._id !== id))
        setRemovingIds((prev) => { const n = new Set(prev); n.delete(id); return n })
        // ─── playful delete acknowledgement ───
        const msg = DELETE_SUCCESS_MESSAGES[Math.floor(Math.random() * DELETE_SUCCESS_MESSAGES.length)]
        setSuccessMsg(msg)
      } catch {
        setRemovingIds((prev) => { const n = new Set(prev); n.delete(id); return n })
        setError('Failed to delete category')
      } finally {
        setPendingDeleteId(null)
      }
    }, 300)
  }

  const handleCancelDelete = () => {
    setConfirmOpen(false)
    setPendingDeleteId(null)
  }

  const itemClass = (id) => [
    'transition-all duration-300 ease-in-out',
    removingIds.has(id)
      ? 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
      : 'opacity-100 translate-x-0 scale-100',
  ].join(' ')

  return (
    <AdminLayout>

      <style>{`
        @keyframes btnBounce {
          0%   { transform: scale(1); }
          35%  { transform: scale(0.7); }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .btn-bounce { animation: btnBounce 0.3s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
      `}</style>

      <ConfirmDialog
        isOpen={confirmOpen}
        message="This category will be permanently deleted and cannot be recovered."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-heading text-brand-black">Categories</h1>
        <HoverButton
          hoverMessages={ADD_HOVER}
          clickMessages={ADD_CLICK}
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-2 self-start sm:self-auto font-body font-semibold px-6 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
        >
          <Plus size={18} className={`transition-transform duration-300 ${showForm ? 'rotate-45' : 'rotate-0'}`} />
          ADD CATEGORY
        </HoverButton>
      </div>

      {/* ─── success / delete acknowledgement toast ─── */}
      <div className={`flex items-center gap-3 mb-4 px-5 py-3 rounded-xl border border-brand-gold/30 bg-brand-gold/5 transition-all duration-500 overflow-hidden ${
        successMsg ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 py-0 mb-0 border-0'
      }`}>
        <span className="text-xl font-body text-brand-gold select-none flex-shrink-0">{successMsg?.face}</span>
        <p className="font-body text-sm text-brand-black font-medium">{successMsg?.text}</p>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        showForm ? 'max-h-48 opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'
      }`}>
        <form onSubmit={handleAddCategory} noValidate
          className="border border-brand-lightgrey rounded-xl p-6 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <label className="font-body text-sm font-medium text-brand-black mb-2 block">Category Name</label>
            <input type="text" value={name} onChange={handleChange}
              className={`w-full font-body border rounded-lg px-4 py-2 text-brand-black outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-transparent transition-all duration-300 ${
                error ? 'border-red-500' : 'border-brand-lightgrey'
              } ${shake ? 'shake-error' : ''}`}
            />
            <p className="h-4 text-red-500 text-xs font-body mt-1 leading-4">{error}</p>
          </div>
          <div className="pb-5">
            <HoverButton
              type="submit"
              hoverMessages={SAVE_HOVER}
              loadingMessages={SAVE_CLICK}
              loading={saving}
              className="font-body font-semibold px-8 py-3 rounded-lg bg-brand-gold text-brand-white hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
            >
              SAVE
            </HoverButton>
          </div>
        </form>
      </div>

      {loading ? (
        <PlayfulLoader variant="admin" />
      ) : categories.length === 0 ? (
        <p className="font-body text-brand-black">No categories yet. Add your first one.</p>
      ) : (
        <>
          <div className="hidden md:block border border-brand-lightgrey rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] font-body text-sm font-semibold text-brand-black bg-brand-lightgrey">
              <p className="px-6 py-4">Category</p>
              <p className="px-6 py-4" />
            </div>

            {categories.map((category) => (
              <div key={category._id} className={`border-t border-brand-lightgrey ${itemClass(category._id)}`}>

                {editingId === category._id ? (
                  <div className="grid grid-cols-[1fr_auto] items-start">
                    <div className="px-6 py-3">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); if (editError) setEditError('') }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')  fireAnim('save',   () => handleEditSave(category._id))
                          if (e.key === 'Escape') fireAnim('cancel', handleEditCancel)
                        }}
                        className={`w-full font-body border rounded-lg px-4 py-2 text-brand-black outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-transparent transition-all duration-300 text-sm ${
                          editError
                            ? `border-red-500 ${editShake ? 'shake-error' : ''}`
                            : 'border-brand-lightgrey'
                        }`}
                      />
                      <p className="h-4 text-red-500 text-xs font-body mt-1 leading-4">{editError}</p>
                    </div>
                    <div className="flex items-center gap-1 px-4 py-3">
                      <button
                        onClick={() => fireAnim('save', () => handleEditSave(category._id))}
                        disabled={updating}
                        title="Save"
                        className={`p-2 rounded-lg bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-white transition-all duration-300 active:scale-90 disabled:opacity-50 ${animBtn === 'save' ? 'btn-bounce' : ''}`}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => fireAnim('cancel', handleEditCancel)}
                        title="Cancel"
                        className={`p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-90 ${animBtn === 'cancel' ? 'btn-bounce' : ''}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_auto] items-center font-body text-sm text-brand-black">
                    <p className="px-6 py-4 font-medium truncate">{category.name}</p>
                    <div className="flex items-center gap-1 px-4">
                      <button onClick={() => handleEditStart(category)} title="Edit"
                        className="p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-75">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDeleteClick(category._id)} title="Delete"
                        className="p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-75">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {categories.map((category) => (
              <div key={category._id}
                className={`border border-brand-lightgrey rounded-xl overflow-hidden ${itemClass(category._id)}`}>

                {editingId === category._id ? (
                  <div className="px-5 py-4 flex flex-col gap-2">
                    <input
                      ref={editingId === category._id ? editInputRef : null}
                      type="text"
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); if (editError) setEditError('') }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')  fireAnim('save',   () => handleEditSave(category._id))
                        if (e.key === 'Escape') fireAnim('cancel', handleEditCancel)
                      }}
                      className={`w-full font-body border rounded-lg px-4 py-2 text-brand-black outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-transparent transition-all duration-300 text-sm ${
                        editError
                          ? `border-red-500 ${editShake ? 'shake-error' : ''}`
                          : 'border-brand-lightgrey'
                      }`}
                    />
                    <p className="h-4 text-red-500 text-xs font-body leading-4">{editError}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fireAnim('save', () => handleEditSave(category._id))}
                        disabled={updating}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-gold text-white font-body text-sm font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 ${animBtn === 'save' ? 'btn-bounce' : ''}`}
                      >
                        <Check size={14} /> SAVE
                      </button>
                      <button
                        onClick={() => fireAnim('cancel', handleEditCancel)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border border-brand-lightgrey text-brand-black font-body text-sm font-semibold transition-all duration-300 active:scale-95 ${animBtn === 'cancel' ? 'btn-bounce' : ''}`}
                      >
                        <X size={14} /> CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-4 flex items-center justify-between">
                    <p className="font-body font-semibold text-brand-black text-base truncate">
                      {category.name}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEditStart(category)}
                        className="p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-75">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDeleteClick(category._id)}
                        className="p-2 rounded-lg text-brand-black hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300 active:scale-75">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

    </AdminLayout>
  )
}

export default Categories