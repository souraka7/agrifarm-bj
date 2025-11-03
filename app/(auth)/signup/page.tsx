'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

const COMMUNES = [
  'Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Djougou', 
  'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Natitingou'
]

const PRODUCTION_TYPES = [
  'Légumes', 'Fruits', 'Céréales', 'Tubercules', 'Épicerie',
  'Viandes', 'Poissons', 'Produits Laitiers', 'Épices', 'Boissons'
]

export default function SignUp() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    commune: '',
    role: 'buyer' as 'farmer' | 'buyer',
    productionType: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned')

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: formData.role,
          full_name: formData.fullName,
          phone: formData.phone,
          commune: formData.commune,
          production_type: formData.role === 'farmer' ? formData.productionType : null
        })

      if (profileError) throw profileError

      toast({
        title: 'Compte créé avec succès!',
        description: 'Vous pouvez maintenant vous connecter.',
      })

      router.push('/login')
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
          <CardDescription className="text-center">
            Rejoignez AgriFarm et commencez à vendre ou acheter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Je suis un</Label>
              <Select value={formData.role} onValueChange={(value: 'farmer' | 'buyer') => handleChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Acheteur</SelectItem>
                  <SelectItem value="farmer">Agriculteur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Votre nom complet"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+229 XX XX XX XX"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commune">Commune</Label>
              <Select value={formData.commune} onValueChange={(value) => handleChange('commune', value)}>
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

            {formData.role === 'farmer' && (
              <div className="space-y-2">
                <Label htmlFor="productionType">Type de production</Label>
                <Select value={formData.productionType} onValueChange={(value) => handleChange('productionType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Que produisez-vous ?" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>

            <div className="text-center text-sm">
              Déjà un compte?{' '}
              <Link href="/login" className="text-green-600 hover:underline">
                Se connecter
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
