'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  total_users: number
  total_orders: number
  total_revenue: number
  pending_verifications: number
  active_products: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_verifications: 0,
    active_products: 0
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Compter les utilisateurs
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Compter les commandes
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      // Revenu total
      const { data: revenueData } = await supabase
        .from('orders')
        .select('final_amount')
        .eq('payment_status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.final_amount, 0) || 0

      // Vérifications en attente
      const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'farmer')
        .eq('is_verified', false)

      // Produits actifs
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setStats({
        total_users: usersCount || 0,
        total_orders: ordersCount || 0,
        total_revenue: totalRevenue,
        pending_verifications: pendingCount || 0,
        active_products: productsCount || 0
      })
    } catch (error) {
      console.error('Error loading admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Admin</h1>
          <p className="text-gray-600">Vue d'ensemble de la plateforme AgriFarm</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-gray-500">
                +12% ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
              <p className="text-xs text-gray-500">
                +8% ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.total_revenue)}
              </div>
              <p className="text-xs text-gray-500">
                +15% ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_products}</div>
              <p className="text-xs text-gray-500">
                +5% ce mois-ci
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertes et Actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alertes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertes et Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.pending_verifications > 0 && (
                <div className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-orange-800">
                      Vérifications en attente
                    </div>
                    <div className="text-sm text-orange-600">
                      {stats.pending_verifications} agriculteur(s) à vérifier
                    </div>
                  </div>
                  <Link href="/admin/verifications">
                    <Button size="sm" variant="outline">
                      Vérifier
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-semibold text-blue-800">
                    Rapports de modération
                  </div>
                  <div className="text-sm text-blue-600">
                    3 signalements en attente
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Examiner
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                <div>
                  <div className="font-semibold text-green-800">
                    Performance système
                  </div>
                  <div className="text-sm text-green-600">
                    Tous les systèmes fonctionnent normalement
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  OK
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Gestion de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/verifications" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Vérifications agriculteurs
                  {stats.pending_verifications > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.pending_verifications}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gestion des utilisateurs
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Voir toutes les commandes
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics et rapports
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Signalements
                <Badge variant="outline" className="ml-auto">
                  3
                </Badge>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dernières activités */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Les dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Nouvelle commande', user: 'Jean Dupont', time: '2 min', amount: '15,000 FCFA' },
                { action: 'Inscription agriculteur', user: 'Marie Konfo', time: '5 min', status: 'En attente' },
                { action: 'Avis publié', user: 'Paul Sessou', time: '10 min', rating: '5 étoiles' },
                { action: 'Produit ajouté', user: 'Farm Bio', time: '15 min', product: 'Tomates bio' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-sm text-gray-500">par {activity.user}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{activity.time}</div>
                    <div className="text-xs text-gray-500">
                      {activity.amount || activity.status || activity.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
