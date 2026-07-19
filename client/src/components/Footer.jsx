import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function Footer() {
  const { isDark } = useTheme()

  return (
    <footer className={`w-full px-6 md:px-8 py-12 mt-20 transition-colors duration-500 ${isDark ? 'bg-brand-white text-brand-black' : 'bg-brand-black text-brand-white'}`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <h2 className="text-3xl font-heading mb-3">Khadija Garments</h2>
          <p className="text-sm font-body font-light">
            Timeless style, delivered.
          </p>
        </div>

        <div>
          <h3 className="text-brand-gold text-xs font-body font-bold tracking-widest mb-4 uppercase">Shop</h3>
          <div className="flex flex-col gap-2 text-sm font-body">
            <Link to="/catalogue" className="link-underline inline-block w-fit hover:text-brand-gold transition-all duration-300 active:scale-95">All Products</Link>
            <Link to="/catalogue?filter=new" className="link-underline inline-block w-fit hover:text-brand-gold transition-all duration-300 active:scale-95">New Arrivals</Link>
            <Link to="/catalogue?filter=bestsellers" className="link-underline inline-block w-fit hover:text-brand-gold transition-all duration-300 active:scale-95">Best Sellers</Link>
          </div>
        </div>

        <div>
          <h3 className="text-brand-gold text-xs font-body font-bold tracking-widest mb-4 uppercase">Support</h3>
          <div className="flex flex-col gap-2 text-sm font-body">
            <Link to="/contact" className="link-underline inline-block w-fit hover:text-brand-gold transition-all duration-300 active:scale-95">Contact Us</Link>
            <Link to="/about" className="link-underline inline-block w-fit hover:text-brand-gold transition-all duration-300 active:scale-95">About Us</Link>
            <a href="/size-guide.png" target="_blank" rel="noopener noreferrer" className="link-underline inline-block w-fit hover:text-brand-gold transition-all duration-300 active:scale-95">Size Guide</a>
          </div>
        </div>

        <div>
          <h3 className="text-brand-gold text-xs font-body font-bold tracking-widest mb-4 uppercase">Contact</h3>
          <div className="flex flex-col gap-2 text-sm font-body break-words">
            <p>Shaikh Feroz Hussain, CEO</p>
            <p className="break-all">rozefyas876@gmail.com</p>
            <p>+91 90827 58821</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer