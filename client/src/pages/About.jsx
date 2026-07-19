import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import PlayfulLoader from '../components/PlayfulLoader'
import Reveal from '../components/Reveal'

const TAGLINES = [
  'crafted with love >w<',
  'comfort meets elegance ^_^',
  'quality in every stitch >o<',
  'made for real women ^o^',
  'timeless. thoughtful. ours. uwu',
]

function About() {
  const { isDark } = useTheme()
  const textColor = isDark ? 'text-brand-white' : 'text-brand-black'

  const [loading, setLoading] = useState(true)
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % TAGLINES.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(cycle)
  }, [])

  if (loading) return <PlayfulLoader variant="customer" />

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-24">
      <Reveal as="h1" className={`text-5xl font-heading mb-3 transition-colors duration-500 ${textColor}`}>
        About Us
      </Reveal>

      <p
        className="font-body text-brand-gold text-sm tracking-widest mb-8 transition-opacity duration-300"
        style= {{opacity: visible ? 1 : 0 }}
      >
        {TAGLINES[idx]}
      </p>

      <Reveal as="div" delay={120} className={`font-body font-light leading-relaxed flex flex-col gap-6 transition-colors duration-500 ${textColor}`}>
        <p>
          Khadija Garments was founded on a simple belief — that comfort and elegance should never be at odds. We specialize exclusively in women's bottom wear, crafting pieces that blend timeless silhouettes with everyday wearability.
        </p>
        <p>
          Every product in our collection is designed with intention, from the fabric selection to the final stitch, ensuring quality that lasts and style that never fades.
        </p>
        <p>
          Led by Shaikh Feroz Hussain, our team is committed to bringing thoughtfully made garments to customers who value both craftsmanship and comfort.
        </p>
      </Reveal>
    </div>
  )
}

export default About