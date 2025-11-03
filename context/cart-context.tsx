'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Product } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export interface CartItem {
  product: Product
  quantity: number
  farmerId: string
}

interface CartState {
  items: CartItem[]
  total: number
  commission: number
  deliveryFee: number
  finalTotal: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextType {
  state: CartState
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  syncWithServer: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const COMMISSION_RATE = 0.10 // 10%
const FREE_COMMISSION_DAYS = 45
const DELIVERY_FEE = 1000 // FCFA

function calculateTotals(items: CartItem[]): Omit<CartState, 'items'> {
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  
  // Pour le MVP, on considère que la commission s'applique toujours
  // En production, il faudrait vérifier la date d'inscription du farmer
  const commission = subtotal * COMMISSION_RATE
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0
  const finalTotal = subtotal + commission + deliveryFee

  return {
    total: subtotal,
    commission,
    deliveryFee,
    finalTotal
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === action.payload.product.id
      )

      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        newItems = [...state.items, action.payload]
      }

      const totals = calculateTotals(newItems)
      return { ...state, items: newItems, ...totals }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product.id !== action.payload)
      const totals = calculateTotals(newItems)
      return { ...state, items: newItems, ...totals }
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.product.id === action.payload.productId
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0)

      const totals = calculateTotals(newItems)
      return { ...state, items: newItems, ...totals }
    }

    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
        commission: 0,
        deliveryFee: 0,
        finalTotal: 0
      }

    case 'LOAD_CART':
      const totals = calculateTotals(action.payload)
      return { ...state, items: action.payload, ...totals }

    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  total: 0,
  commission: 0,
  deliveryFee: 0,
  finalTotal: 0
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const supabase = createClient()

  // Charger le panier depuis le localStorage et Supabase
  useEffect(() => {
    const loadCart = async () => {
      // D'abord depuis le localStorage
      const savedCart = localStorage.getItem('agrifarm-cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          dispatch({ type: 'LOAD_CART', payload: parsedCart.items })
        } catch (error) {
          console.error('Error loading cart from localStorage:', error)
        }
      }

      // Ensuite synchroniser avec Supabase si l'utilisateur est connecté
      await syncWithServer()
    }

    loadCart()
  }, [])

  // Sauvegarder dans le localStorage
  useEffect(() => {
    localStorage.setItem('agrifarm-cart', JSON.stringify({
      items: state.items,
      timestamp: new Date().toISOString()
    }))
  }, [state.items])

  const syncWithServer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Ici on pourrait synchroniser avec une table 'cart' en base
      // Pour le MVP, on garde seulement le localStorage
    } catch (error) {
      console.error('Error syncing cart with server:', error)
    }
  }

  const addItem = (product: Product, quantity: number) => {
    const cartItem: CartItem = {
      product,
      quantity,
      farmerId: product.farmer_id
    }
    dispatch({ type: 'ADD_ITEM', payload: cartItem })
  }

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      syncWithServer
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
