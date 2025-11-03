'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Product, FilterState } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/marketplace/product-card'
import { FiltersSidebar } from '@/components/marketplace/filters-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Grid3X3, List } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'proximity', label: 'Proximité' }
]

const INITIAL_FILTERS: FilterState = {
  categories: [],
  priceRange: [0, 100000],
  commune: '',
  radius: 50,
  availability: false,
  minRating: 0,
  verifiedOnly: false,
  sortBy: 'relevance',
  searchQuery: ''
}

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const supabase = createClient()

  // Synchroniser les filtres avec l'URL
  useEffect(() => {
    const urlFilters: Partial<FilterState> = {}
    
    searchParams.forEach((value, key) => {
      if (key === 'categories') {
        urlFilters.categories = value.split(',')
      } else if (key === 'priceRange') {
        urlFilters.priceRange = value.split(',').map(Number) as [number, number]
      } else if (key === 'minRating') {
        urlFilters.minRating = Number(value)
      } else if (key === 'radius') {
        urlFilters.radius = Number(value)
      } else if (key === 'sortBy') {
        urlFilters.sortBy = value as any
      } else if (key in INITIAL_FILTERS) {
        (urlFilters as any)[key] = value === 'true' ? true : value === 'false' ? false : value
      }
    })

    setFilters(prev => ({ ...prev, ...urlFilters }))
  }, [searchParams])

  // Mettre à jour l'URL quand les filtres changent
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','))
        } else if (typeof value === 'boolean') {
          params.set(key, value.toString())
        } else {
          params.set(key, value.toString())
        }
      }
    })

    router.replace(`/marketplace?${params.toString()}`, { scroll: false })
  }, [router])

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
    updateURL(newFilters)
    fetchProducts(newFilters, 1)
  }

  const handleReset = () => {
    setFilters(INITIAL_FILTERS)
    setPage(1)
    updateURL(INITIAL_FILTERS)
    fetchProducts(INITIAL_FILTERS, 1)
  }

  const fetchProducts = async (currentFilters: FilterState, currentPage: number, append = false) => {
    setLoading(true)
    
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          farmer:profiles(*),
          category:categories(*)
        `)
        .eq('is_active', true)

      // Filtre de recherche
      if (currentFilters.searchQuery) {
        query = query.ilike('name', `%${currentFilters.searchQuery}%`)
      }

      // Filtre catégories
      if (currentFilters.categories.length > 0) {
        query = query.in('category_id', currentFilters.categories)
      }

      // Filtre prix
      query = query.gte('price', currentFilters.priceRange[0])
      query = query.lte('price', currentFilters.priceRange[1])

      // Filtre disponibilité
      if (currentFilters.availability) {
        query = query.eq('availability', 'available')
      }

      // Filtre rating
      if (currentFilters.minRating > 0) {
        query = query.gte('rating', currentFilters.minRating)
      }

      // Filtre agriculteurs vérifiés
      if (currentFilters.verifiedOnly) {
        query = query.eq('farmer.is_verified', true)
      }

      // Tri
      switch (currentFilters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'rating':
          query = query.order('rating', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      // Pagination
      const from = (currentPage - 1) * 20
      const to = from + 19
      query = query.range(from, to)

      const { data, error } = await query

      if (error) throw error

      if (append) {
        setProducts(prev => [...prev, ...(data || [])])
      } else {
        setProducts(data || [])
      }

      setHasMore((data?.length || 0) === 20)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(filters, page)
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts(filters, 1)
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }

  const handleAddToCart = (product: Product) => {
    // Implémentation du panier dans la partie suivante
    console.log('Add to cart:', product)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Marché Agricole du Bénin
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Achetez directement auprès des agriculteurs locaux
          </p>
          
          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Rechercher des produits, agriculteurs..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-12 pr-4 py-3 text-lg border-0 focus:ring-2 focus:ring-green-300"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Button 
                type="submit" 
                className="absolute right-2 top-1 bg-green-500 hover:bg-green-400"
              >
                Rechercher
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar des filtres */}
          <FiltersSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            productCount={products.length}
          />

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Barre d'outils */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFiltersChange({ ...filters, sortBy: value as any })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {products.length} produit{products.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Grille de produits */}
            {loading && page === 1 ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Bouton Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? 'Chargement...' : 'Charger plus'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <div className="flex items-center gap-2 pt-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
      <p className="text-gray-600 mb-4">
        Essayez de modifier vos filtres ou votre recherche
      </p>
      <Button>
        Voir tous les produits
      </Button>
    </div>
  )
}
