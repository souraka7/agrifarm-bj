'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Package, MessageCircle, Home } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Order {
  id: string
  final_amount: number
  payment_status: string
  delivery_commune: string
  delivery_date: string
  created_at: string
}

export default function OrderSuccessPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setOrder(data)
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Commande non trouvée</h1>
          <Link href="/marketplace">
            <Button>Retour à la boutique</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icône de succès */}
          <div className="mb-6">
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
          </div>

          {/* Message de confirmation */}
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            Paiement Réussi !
          </h1>
          <p className="text-xl text-green-600 mb-8">
            Votre commande a été confirmée et est en cours de traitement.
          </p>

          {/* Détails de la commande */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Détails de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <div className="font-semibold">N° de commande</div>
                  <div className="text-gray-600">{order.id.slice(0, 8)}...</div>
                </div>
                <div>
                  <div className="font-semibold">Montant total</div>
                  <div className="text-green-600 font-bold">{formatPrice(order.final_amount)}</div>
                </div>
                <div>
                  <div className="font-semibold">Statut</div>
                  <div className="text-green-600 font-semibold">Confirmée</div>
                </div>
                <div>
                  <div className="font-semibold">Livraison à</div>
                  <div className="text-gray-600">{order.delivery_commune}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prochaines étapes */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Prochaines étapes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div className="text-left">
                    <div className="font-semibold">Préparation de votre commande</div>
                    <div className="text-gray-600">L'agriculteur prépare vos produits</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MessageCircle className="h-8 w-8 text-green-500" />
                  <div className="text-left">
                    <div className="font-semibold">Suivi en temps réel</div>
                    <div className="text-gray-600">Vous recevrez des mises à jour par SMS</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/buyer/orders">
              <Button variant="outline" size="lg">
                <Package className="h-5 w-5 mr-2" />
                Voir mes commandes
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Home className="h-5 w-5 mr-2" />
                Continuer mes achats
              </Button>
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 text-sm text-gray-600">
            <p>Des questions ? Contactez-nous au <strong>+229 XX XX XX XX</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
