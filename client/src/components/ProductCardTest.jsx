import { useState } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import frontSide from '../assets/0101.png'

function ProductCardTest() {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)

  const product = {
    article: '0101',
    title: 'Rayon Regular Plazzo',
    subtitle: 'Rayon · Regular Fit',
    price: '499',
    badge: 'NEW',
  }

  const cardBorder = isDark ? 'border-brand-grey' : 'border-brand-lightgrey'
  const textColor = isDark ? 'text-brand-white' : 'text-brand-black'
  const panelBg = isDark ? 'bg-brand-black' : 'bg-brand-white'

  return (
    <div className="max-w-xs mx-auto py-16">
      <div
        onClick={() => setOpen(true)}
        className={`group cursor-pointer border rounded-xl overflow-hidden transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-brand-black' : 'bg-brand-white'} ${cardBorder}`}
      >
        <div
          className="aspect-[3/4] w-full transition-transform duration-500 ease-out group-hover:scale-105"
          style={{
            backgroundImage: `url(${frontSide})`,
            backgroundSize: '200% 100%',
            backgroundPosition: 'left center',
          }}
        />
        <div className="p-4">
          <h3 className={`font-body font-semibold text-base mb-1 truncate transition-colors duration-500 ${textColor}`}>
            {product.title}
          </h3>
          <p className={`font-body text-sm mb-2 truncate transition-colors duration-500 ${textColor}`}>
            {product.subtitle}
          </p>
          <p className="text-brand-gold font-body font-bold text-lg">
            ₹{product.price}
          </p>
        </div>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-brand-black/70 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md max-h-[90vh] overflow-auto rounded-xl border ${cardBorder} ${panelBg}`}
          >
            <button
              onClick={() => setOpen(false)}
              className={`absolute top-4 right-4 z-10 border-2 rounded-lg p-1.5 transition-all duration-300 ease-out ${isDark ? 'border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black' : 'border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white'}`}
            >
              <X size={20} />
            </button>

            <div className="flex flex-col">
              <div
                className="aspect-[3/4] w-full"
                style={{
                  backgroundImage: `url(${frontSide})`,
                  backgroundSize: '200% 100%',
                  backgroundPosition: 'left center',
                }}
              />
              <div
                className="aspect-[3/4] w-full"
                style={{
                  backgroundImage: `url(${frontSide})`,
                  backgroundSize: '200% 100%',
                  backgroundPosition: 'right center',
                }}
              />
            </div>

            <div className="p-6">
              <p className={`font-body text-xs tracking-widest uppercase mb-1 ${textColor}`}>
                Article {product.article}
              </p>
              <h2 className={`font-heading text-3xl mb-1 ${textColor}`}>
                {product.title}
              </h2>
              <p className={`font-body text-sm mb-3 ${textColor}`}>
                {product.subtitle}
              </p>
              <p className="text-brand-gold font-body font-bold text-xl">
                ₹{product.price}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductCardTest