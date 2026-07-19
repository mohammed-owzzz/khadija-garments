import { useState, useEffect } from 'react'

const DEFAULT_MESSAGES = [
  'hang tight >o<',
  'almost there ^_^',
  'one sec >w<',
  'on it ^o^',
]

function ButtonLoader({ messages = DEFAULT_MESSAGES }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 750)
    return () => clearInterval(t)
  }, [messages.length])

  return (
    <span className="font-body font-semibold tracking-widest text-sm uppercase animate-pulse-soft inline-block">
      {messages[idx]}
    </span>
  )
}

export default ButtonLoader