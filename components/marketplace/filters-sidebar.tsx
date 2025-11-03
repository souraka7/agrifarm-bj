'use client'

import { useState } from 'react'
import { FilterState } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Filter, X, Star, MapPin, CheckCircle } from 'lucide-react'

const COMMUNES = [
  'Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Djougou', 
  'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Natitingou'
]

const CATEGORIES = [
  { id: 'legumes', name: 'Légumes', icon: '🥦' },
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
  { id: 'cereales', name: 'Céréales', icon: '🌾' },
  { id: 'tubercules', name: 'Tubercules', icon: '🍠' },
  { id: 'epicerie', name: 'Épicerie', icon: '🛒' },
  { id: 'viandes', name: 'Viandes', icon: '🍗' },
  { id: 'poissons', name: 'Poissons', icon: '🐟' },
  { id: 'produits-laitiers', name: 'Produits Laitiers', icon: '🥛' },
  { id: 'epices', name: 'Épices', icon: '🌶️' },
  { id: 'boissons', name: 'Boissons', icon: '🥤' }
]

interface FiltersSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onReset: () => void
  productCount: number
}

export function FiltersSidebar({ filters, onFiltersChange, onReset, productCount }: FiltersSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId]
    updateFilter('categories', newCategories)
  }

  const handleRatingClick = (rating: number) => {
    updateFilter('minRating', filters.minRating === rating ? 0 : rating)
  }

  return (
    <>
      {/* Mobile Trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {Object.values(filters).some(val => 
              Array.isArray(val) ? val.length > 0 : 
              typeof val === 'number' ? val > 0 : 
              typeof val === 'boolean' ? val : false
            ) && (
              <span className="ml-2 h-2 w-2 rounded-full bg-green-600" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FiltersContent 
              filters={filters} 
              updateFilter={updateFilter}
              handleCategoryToggle={handleCategoryToggle}
              handleRatingClick={handleRatingClick}
              onReset={onReset}
              productCount={productCount}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 space-y-6">
        <FiltersContent 
          filters={filters} 
          updateFilter={updateFilter}
          handleCategoryToggle={handleCategoryToggle}
          handleRatingClick={handleRatingClick}
          onReset={onReset}
          productCount={productCount}
        />
      </div>
    </>
  )
}

function FiltersContent({ 
  filters, 
  updateFilter, 
  handleCategoryToggle, 
  handleRatingClick, 
  onReset,
  productCount 
}: any) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtres</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4 mr-1" />
          Réinitialiser
        </Button>
      </div>

      {/* Catégories */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Catégories</Label>
        <div className="space-y-2">
          {CATEGORIES.map(category => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={filters.categories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <label
                htmlFor={`category-${category.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Prix */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Prix (FCFA)
        </Label>
        <div className="space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value)}
            max={100000}
            step={1000}
            className="my-6"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filters.priceRange[0].toLocaleString()} FCFA</span>
            <span>{filters.priceRange[1].toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div>
        <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Localisation
        </Label>
        <div className="space-y-4">
          <Select value={filters.commune} onValueChange={(value) => updateFilter('commune', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une commune" />
            </SelectTrigger>
            <SelectContent>
              {COMMUNES.map(commune => (
                <SelectItem key={commune} value={commune}>{commune}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">
              Rayon: {filters.radius} km
            </Label>
            <Slider
              value={[filters.radius]}
              onValueChange={(value) => updateFilter('radius', value[0])}
              max={100}
              step={5}
            />
          </div>
        </div>
      </div>

      {/* Disponibilité */}
      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="availability"
            checked={filters.availability}
            onCheckedChange={(checked) => updateFilter('availability', checked)}
          />
          <label
            htmlFor="availability"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Disponible maintenant
          </label>
        </div>
      </div>

      {/* Rating minimum */}
      <div>
        <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
          <Star className="h-4 w-4" />
          Note minimum
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => handleRatingClick(rating)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                filters.minRating >= rating
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Star className={`h-3 w-3 ${filters.minRating >= rating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {rating}+
            </button>
          ))}
        </div>
      </div>

      {/* Agriculteur vérifié */}
      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verifiedOnly"
            checked={filters.verifiedOnly}
            onCheckedChange={(checked) => updateFilter('verifiedOnly', checked)}
          />
          <label
            htmlFor="verifiedOnly"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4 text-blue-500" />
            Agriculteurs vérifiés uniquement
          </label>
        </div>
      </div>

      {/* Résultats */}
      <div className="pt-4 border-t">
        <p className="text-sm text-gray-600">
          {productCount} produit{productCount > 1 ? 's' : ''} trouvé{productCount > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
