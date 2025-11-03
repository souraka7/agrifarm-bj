'use client'

import { useCart } from '@/context/cart-context'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { state, updateQuantity, removeItem, clearCart } = useCart()

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    updateQuantity(productId, newQuantity)
  }

  const groupItemsByFarmer = () => {
    const groups: { [key: string]: any[] } = {}
    
    state.items.forEach(item => {
      if (!groups[item.farmerId]) {
        groups[item.farmerId] = []
      }
      groups[item.farmerId].push(item)
    })

    return groups
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Votre panier est vide</h1>
            <p className="text-gray-600 mb-8">
              Découvrez nos produits frais et locaux
            </p>
            <Link href="/marketplace">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Explorer la marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const farmerGroups = groupItemsByFarmer()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Mon Panier</h1>
          <Button variant="outline" onClick={clearCart}>
            Vider le panier
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des produits */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(farmerGroups).map(([farmerId, items]) => (
              <Card key={farmerId}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium">
                      {items[0].product.farmer?.full_name?.charAt(0) || 'A'}
                    </div>
                    {items[0].product.farmer?.full_name || 'Agriculteur'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="relative h-20 w-20 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.product.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {formatPrice(item.product.price)} / {item.product.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Contrôle quantité */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                            min="1"
                          />
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Sous-total */}
                        <div className="text-right min-w-[100px]">
                          <div className="font-semibold text-lg">
                            {formatPrice(item.product.price * item.quantity)}
                          </div>
                        </div>

                        {/* Supprimer */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Récapitulatif */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{formatPrice(state.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission (10%)</span>
                    <span>{formatPrice(state.commission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais de livraison</span>
                    <span>{formatPrice(state.deliveryFee)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600">{formatPrice(state.finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Code promo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code promo</label>
                  <div className="flex gap-2">
                    <Input placeholder="Entrez votre code" />
                    <Button variant="outline">Appliquer</Button>
                  </div>
                </div>

                {/* Bouton checkout */}
                <Link href="/checkout" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg">
                    Passer commande
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>

                <p className="text-xs text-gray-500 text-center">
                  Paiement sécurisé via FedaPay
                </p>
              </CardContent>
            </Card>

            {/* Sécurité */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Paiement sécurisé
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    Livraison garantie
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    Support 7j/7
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
