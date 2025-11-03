'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Star, MapPin, CheckCircle } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const mainImage = product.images?.[0] || '/placeholder-product.jpg'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product)
  }

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const availabilityColors = {
    available: 'bg-green-100 text-green-800',
    preorder: 'bg-blue-100 text-blue-800',
    out_of_stock: 'bg-gray-100 text-gray-800'
  }

  const availabilityLabels = {
    available: 'Disponible',
    preorder: 'Précommande',
    out_of_stock: 'Rupture'
  }

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`}>
        <div className="relative overflow-hidden rounded-t-lg">
          {/* Image avec effet de zoom */}
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={imageError ? '/placeholder-product.jpg' : mainImage}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              onError={() => setImageError(true)}
            />
            
            {/* Overlay au hover */}
            <div className={`absolute inset-0 bg-black/0 transition-all duration-300 ${
              isHovered ? 'bg-black/10' : ''
            }`} />
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className={`${availabilityColors[product.availability]} font-semibold`}>
              {availabilityLabels[product.availability]}
            </Badge>
            {product.category && (
              <Badge variant="secondary" className="font-medium">
                {product.category.icon} {product.category.name}
              </Badge>
            )}
          </div>

          {/* Bouton favoris */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            onClick={toggleFavorite}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </Button>

          {/* Bouton Ajouter au panier (apparaît au hover) */}
          <div className={`absolute bottom-2 right-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              onClick={handleAddToCart}
            >
              Ajouter
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Nom et prix */}
          <div className="mb-2">
            <h3 className="font-semibold text-lg line-clamp-1 mb-1">{product.name}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-gray-500">/{product.unit}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-500">({product.total_reviews})</span>
          </div>

          {/* Agriculteur */}
          {product.farmer && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="relative">
                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                  {product.farmer.full_name.charAt(0)}
                </div>
                {product.farmer.is_verified && (
                  <CheckCircle className="h-3 w-3 text-blue-500 absolute -top-1 -right-1 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.farmer.full_name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{product.farmer.commune}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
