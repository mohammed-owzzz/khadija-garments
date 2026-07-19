import { useTheme } from '../context/ThemeContext'

// Playful no-image faces cycling
const NO_IMG_FACES = ['>o<', '^_^', '>w<', '^o^']

// Crop to the FRONT (left) panel of the 2-panel product image server-side, then
// deliver an optimised, retina-friendly image. Cropping on Cloudinary means the
// card uses full resolution for the visible area (no client-side 200% half-hiding
// that wasted half the pixels and caused jagged/aliased edges).
// Non-Cloudinary URLs are returned untouched.
function cardImage(url) {
  if (!url || !url.includes('/upload/')) return url
  return url.replace(
    '/upload/',
    '/upload/c_crop,w_0.5,h_1.0,g_west/c_limit,w_1400/f_auto,q_90/'
  )
}

function Card({ image, title, subtitle, price, badge, onClick }) {
  const { isDark } = useTheme()

  // Deterministic face based on title so it stays consistent per product
  const faceIdx  = title ? title.charCodeAt(0) % NO_IMG_FACES.length : 0
  const noImgFace = NO_IMG_FACES[faceIdx]

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer border rounded-xl overflow-hidden transition-all duration-300 ease-out hover:shadow-xl hover:border-brand-gold hover:-translate-y-1 active:scale-[0.98] ${
        isDark ? 'bg-brand-black border-brand-grey' : 'bg-brand-white border-brand-lightgrey'
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-lightgrey">
        {image ? (
          /* Front view only — left half of the 2-panel product image */
          <div className="relative w-full h-full">
            <img
              src={cardImage(image)}
              alt={title}
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-grey">
            <span className="text-5xl select-none">{noImgFace}</span>
          </div>
        )}
        {badge && (
          <span className="absolute top-3 left-3 bg-brand-gold text-brand-white text-xs font-body font-bold tracking-widest uppercase px-3 py-1 rounded-full">
            {badge}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <h3 className={`font-body font-semibold text-base mb-1 truncate transition-colors duration-500 group-hover:text-brand-gold ${
          isDark ? 'text-brand-white' : 'text-brand-black'
        }`}>
          {title}
        </h3>
        {subtitle && (
          <p className={`font-body text-sm mb-2 truncate transition-colors duration-500 ${
            isDark ? 'text-brand-white' : 'text-brand-black'
          }`}>
            {subtitle}
          </p>
        )}
        {price && (
          <p className="text-brand-gold font-body font-bold text-lg inline-block origin-left transition-transform duration-300 group-hover:scale-105">&#8377;{price}</p>
        )}
      </div>
    </div>
  )
}

export default Card