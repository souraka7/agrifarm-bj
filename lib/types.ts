export interface Product {
  id: string
  farmer_id: string
  category_id: string
  name: string
  slug: string
  description: string
  price: number
  unit: string
  quantity: number
  images: string[]
  availability: 'available' | 'preorder' | 'out_of_stock'
  preorder_date: string | null
  commune: string
  delivery_radius: number
  is_active: boolean
  views: number
  sales_count: number
  rating: number
  total_reviews: number
  created_at: string
  updated_at: string
  farmer?: Profile
  category?: Category
}

export interface Profile {
  id: string
  role: 'farmer' | 'buyer' | 'admin'
  full_name: string
  phone: string
  commune: string
  production_type: string | null
  avatar_url: string | null
  is_verified: boolean
  rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  created_at: string
}

export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  commune: string
  radius: number
  availability: boolean
  minRating: number
  verifiedOnly: boolean
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'proximity'
  searchQuery: string
}
export interface Conversation {
  id: string
  farmer_id: string
  buyer_id: string
  last_message: string | null
  last_message_at: string
  unread_count: number
  created_at: string
  updated_at: string
  farmer?: Profile
  buyer?: Profile
  other_user?: Profile // Pour faciliter l'affichage
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'location'
  image_url: string | null
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  loading: boolean
  sending: boolean
  hasMore: boolean
}
