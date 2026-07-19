import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('khadija_cart')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('khadija_cart', JSON.stringify(items))
  }, [items])

  const sameLine = (a, b) => a.id === b.id && a.size === b.size && a.colour === b.colour

  const addToCart = (product) => {
    setItems((prev) => {
      const existing = prev.find((item) => sameLine(item, product))
      if (existing) {
        return prev.map((item) =>
          sameLine(item, product)
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        )
      }
      return [...prev, product]
    })
  }

  const removeFromCart = (id, size, colour) => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.size === size && item.colour === colour)))
  }

  const updateQuantity = (id, size, colour, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && item.colour === colour
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    )
  }

  const setLineQuantity = (id, size, colour, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && item.colour === colour
          ? { ...item, quantity: value }
          : item
      )
    )
  }

  const setLineColour = (id, size, oldColour, newColour, newHex) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id && i.size === size && i.colour === oldColour)
      if (!target) return prev
      const merge = prev.find(
        (i) => i.id === id && i.size === size && i.colour === newColour && oldColour !== newColour
      )
      if (merge) {
        return prev
          .filter((i) => !(i.id === id && i.size === size && i.colour === oldColour))
          .map((i) =>
            i.id === id && i.size === size && i.colour === newColour
              ? { ...i, quantity: i.quantity + target.quantity }
              : i
          )
      }
      return prev.map((i) =>
        i.id === id && i.size === size && i.colour === oldColour
          ? { ...i, colour: newColour, colourHex: newHex }
          : i
      )
    })
  }

  const clearCart = () => setItems([])

  const num = (q) => Number(q) || 0
  const lineUnitPrice = (item) =>
    num(item.quantity) >= item.moq ? item.wholesalePrice : item.retailPrice
  const lineTotal = (item) => lineUnitPrice(item) * num(item.quantity)
  const cartCount = items.reduce((sum, item) => sum + num(item.quantity), 0)
  const cartTotal = items.reduce((sum, item) => sum + lineTotal(item), 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        setLineQuantity,
        setLineColour,
        clearCart,
        cartCount,
        cartTotal,
        lineUnitPrice,
        lineTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}