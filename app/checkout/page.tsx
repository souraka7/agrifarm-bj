'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cart-context'
import { useAuth } from '@/hooks/use-auth'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Shield, Truck, CreditCard, Smartphone, Wallet, CheckCircle2 } from 'lucide-react'

const COMMUNES = [
  'Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Djougou', 
  'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Natitingou'
]

const MOBILE_NETWORKS = [
  { id: 'mtn', name: 'MTN Money', prefix: '+229' },
  { id: 'moov', name: 'Moov Money', prefix: '+229' }
]

type PaymentMethod = 'mobile_money' | 'card' | 'wallet'
type Step = 'delivery' | 'payment' | 'confirmation'

export default function CheckoutPage() {
  const router = useRouter()
  const { state: cartState, clearCart } = useCart()
  const { user, profile } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>('delivery')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money')

  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    address: '',
    commune: profile?.commune || '',
    quarter: '',
    deliveryDate: '',
    instructions: ''
  })

  const [paymentInfo, setPaymentInfo] = useState({
    mobileNetwork: 'mtn',
    phoneNumber: profile?.phone || '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  })

  const supabase = createClient()

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep('payment')
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Créer la commande en base
      const order = await createOrder()

      // 2. Processer le paiement
      const paymentResult = await processPayment(order.id, order.final_amount)

      if (paymentResult.success) {
        // 3. Vider le panier et rediriger
        clearCart()
        router.push(`/orders/${order.id}/success`)
      } else {
        throw new Error(paymentResult.error || 'Erreur de paiement')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async () => {
    // Créer la commande principale
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user?.id,
        farmer_id: cartState.items[0]?.farmerId, // Pour le MVP, on prend le premier farmer
        total_amount: cartState.total,
        commission_amount: cartState.commission,
        delivery_fee: cartState.deliveryFee,
        final_amount: cartState.finalTotal,
        delivery_address: `${deliveryInfo.address}, ${deliveryInfo.quarter}`,
        delivery_commune: deliveryInfo.commune,
        delivery_phone: deliveryInfo.phone,
        delivery_date: deliveryInfo.deliveryDate,
        delivery_instructions: deliveryInfo.instructions,
        payment_method: paymentMethod,
        payment_status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Créer les items de commande
    const orderItems = cartState.items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return order
  }

  const processPayment = async (orderId: string, amount: number) => {
    // Implémentation dans l'API route
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        paymentMethod,
        phone: paymentInfo.phoneNumber,
        network: paymentInfo.mobileNetwork
      })
    })

    return response.json()
  }

  const Stepper = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className={`flex items-center ${currentStep === 'delivery' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            currentStep === 'delivery' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <span className="ml-2 font-medium">Livraison</span>
        </div>
        
        <div className="h-1 w-12 bg-gray-200 mx-4"></div>
        
        <div className={`flex items-center ${currentStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            currentStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <span className="ml-2 font-medium">Paiement</span>
        </div>
        
        <div className="h-1 w-12 bg-gray-200 mx-4"></div>
        
        <div className={`flex items-center ${currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}>
            3
          </div>
          <span className="ml-2 font-medium">Confirmation</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Stepper />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            {currentStep === 'delivery' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Informations de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDeliverySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nom complet</Label>
                        <Input
                          id="fullName"
                          value={deliveryInfo.fullName}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={deliveryInfo.phone}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={deliveryInfo.address}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Rue, avenue..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="commune">Commune</Label>
                        <Select
                          value={deliveryInfo.commune}
                          onValueChange={(value) => setDeliveryInfo(prev => ({ ...prev, commune: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre commune" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMUNES.map(commune => (
                              <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quarter">Quartier</Label>
                        <Input
                          id="quarter"
                          value={deliveryInfo.quarter}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, quarter: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryDate">Date de livraison souhaitée</Label>
                        <Input
                          id="deliveryDate"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={deliveryInfo.deliveryDate}
                          onChange={(e) => setDeliveryInfo(prev => ({ ...prev, deliveryDate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions de livraison</Label>
                      <Textarea
                        id="instructions"
                        value={deliveryInfo.instructions}
                        onChange={(e) => setDeliveryInfo(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Porte, étage, code..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      Continuer vers le paiement
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {currentStep === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Méthode de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                      {/* Mobile Money */}
                      <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="mobile_money" id="mobile_money" />
                        <Label htmlFor="mobile_money" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Smartphone className="h-5 w-5 text-green-600" />
                              <div>
                                <div className="font-medium">Mobile Money</div>
                                <div className="text-sm text-gray-500">MTN Money / Moov Money</div>
                              </div>
                            </div>
                            <Badge variant="secondary">Populaire</Badge>
                          </div>
                        </Label>
                      </div>

                      {paymentMethod === 'mobile_money' && (
                        <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Réseau</Label>
                              <Select
                                value={paymentInfo.mobileNetwork}
                                onValueChange={(value) => setPaymentInfo(prev => ({ ...prev, mobileNetwork: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {MOBILE_NETWORKS.map(network => (
                                    <SelectItem key={network.id} value={network.id}>
                                      {network.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Téléphone</Label>
                              <Input
                                type="tel"
                                placeholder="+229 XX XX XX XX"
                                value={paymentInfo.phoneNumber}
                                onChange={(e) => setPaymentInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                required
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Vous recevrez un SMS de confirmation sur votre téléphone
                          </p>
                        </div>
                      )}

                      {/* Carte bancaire */}
                      <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium">Carte bancaire</div>
                              <div className="text-sm text-gray-500">Visa, Mastercard</div>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* Portefeuille */}
                      <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-orange-600" />
                            <div>
                              <div className="font-medium">Portefeuille AgriFarm</div>
                              <div className="text-sm text-gray-500">Solde: 0 FCFA</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep('delivery')}
                        className="flex-1"
                      >
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {loading ? 'Traitement...' : `Payer ${formatPrice(cartState.finalTotal)}`}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Produits */}
                <div className="space-y-3">
                  {cartState.items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-xs">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          'IMG'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.product.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.quantity} × {formatPrice(item.product.price)}
                        </div>
                      </div>
                      <div className="font-semibold text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(cartState.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Commission</span>
                    <span>{formatPrice(cartState.commission)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>{formatPrice(cartState.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-green-600">{formatPrice(cartState.finalTotal)}</span>
                  </div>
                </div>

                {/* Sécurité */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  Paiement 100% sécurisé FedaPay
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
