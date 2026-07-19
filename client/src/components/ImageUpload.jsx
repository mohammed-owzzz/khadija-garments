import { useState, useRef, useEffect } from 'react'
import { X, ImagePlus } from 'lucide-react'

const REMOVE_FACES = ['>o<', '^_^', '>w<', '^o^']

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function ImageUpload({ value, onChange, onUploadingChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [dragOver, setDragOver]   = useState(false)
  const [shake, setShake]         = useState(false)
  const [removing, setRemoving]   = useState(false)
  const [removeFace, setRemoveFace] = useState(0)
  const inputRef                  = useRef(null)

  // Notify parent whenever uploading state changes
  useEffect(() => {
    onUploadingChange?.(uploading)
  }, [uploading, onUploadingChange])

  useEffect(() => {
    if (!error) return
    setShake(true)
    const t = setTimeout(() => setShake(false), 400)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {
    if (!removing) return
    const t = setInterval(() => setRemoveFace((i) => (i + 1) % REMOVE_FACES.length), 220)
    return () => clearInterval(t)
  }, [removing])

  const uploadToCloudinary = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Only image files allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size is 10 MB')
      return
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError('Upload not configured. Restart the dev server after editing .env.')
      return
    }

    setError('')
    setUploading(true)

    try {
      const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', UPLOAD_PRESET)

      const res  = await fetch(endpoint, { method: 'POST', body: form })
      const text = await res.text()
      let data = {}
      try { data = text ? JSON.parse(text) : {} } catch { /* non-JSON response */ }

      if (!res.ok) throw new Error(data?.error?.message || `Cloudinary error ${res.status}`)
      if (!data.secure_url) throw new Error('No image URL returned. Set the upload preset to "Unsigned" in Cloudinary.')

      onChange(data.secure_url)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadToCloudinary(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadToCloudinary(file)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    if (removing) return
    setRemoving(true)
    setRemoveFace(0)
    setTimeout(() => {
      onChange('')
      setError('')
      setRemoving(false)
    }, 850)
  }

  return (
    <div className="flex-shrink-0">
      <label className="font-body text-sm font-medium text-brand-black mb-1 block">
        Product Image
      </label>

      <div
        onClick={() => !uploading && !value && inputRef.current?.click()}
        onDragOver={(e) => { if (!value && !uploading) { e.preventDefault(); setDragOver(true) } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { if (!value && !uploading) handleDrop(e) }}
        className={[
          'relative w-40 h-52 rounded-xl overflow-hidden',
          'flex flex-col items-center justify-center',
          'transition-all duration-300 select-none',
          shake ? 'shake-error' : '',
          value
            ? 'border border-brand-lightgrey cursor-default'
            : error
              ? 'border-2 border-dashed border-red-400 cursor-pointer'
              : uploading
                ? 'border-2 border-dashed border-brand-gold bg-brand-gold/5 cursor-wait'
                : dragOver
                  ? 'border-2 border-dashed border-brand-gold bg-brand-gold/5 cursor-pointer scale-[1.02]'
                  : 'border-2 border-dashed border-brand-lightgrey hover:border-brand-gold hover:bg-brand-gold/5 cursor-pointer',
        ].join(' ')}
      >
        {/* Image preview */}
        {value && (
          <>
            <img src={value} alt="Product" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              title="Remove image"
              className={`absolute top-2 right-2 bg-white rounded-full shadow transition-all duration-200 ${
                removing ? 'px-2 py-1 text-brand-gold cursor-wait' : 'p-1 text-brand-black hover:text-brand-gold active:scale-90'
              }`}
            >
              {removing ? (
                <span className="flex items-center gap-1 font-body text-[11px] font-semibold leading-none">
                  <span className="w-3 h-3 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                  {REMOVE_FACES[removeFace]}
                </span>
              ) : (
                <X size={14} />
              )}
            </button>
          </>
        )}

        {/* Uploading */}
        {!value && uploading && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-xs text-brand-gold">uploading ^_^</p>
          </div>
        )}

        {/* Error */}
        {!value && !uploading && error && (
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <ImagePlus size={22} className="text-red-400" />
            <p className="font-body text-xs text-red-500 leading-relaxed">{error}</p>
            <p className="font-body text-xs text-brand-black/40">tap to retry</p>
          </div>
        )}

        {/* Idle */}
        {!value && !uploading && !error && (
          <div className="flex flex-col items-center gap-2">
            <ImagePlus size={24} className="text-brand-lightgrey" />
            <p className="font-body text-xs text-brand-black/40 text-center px-3 leading-relaxed">
              Click or drag<br />to upload
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

export default ImageUpload