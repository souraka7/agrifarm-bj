import { NextRequest, NextResponse } from 'next/server'
import { createMobileMoneyPayment, createCardPayment } from '@/lib/fedapay'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, paymentMethod, phone, network } = await request.json()

    const supabase = await createClient()

    // Vérifier que l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    let paymentResult

    if (paymentMethod === 'mobile_money') {
      paymentResult = await createMobileMoneyPayment(
        phone,
        amount,
        `Commande AgriFarm #${orderId}`
      )
    } else if (paymentMethod === 'card') {
      paymentResult = await createCardPayment(
        amount,
        `Commande AgriFarm #${orderId}`
      )
    } else {
      return NextResponse.json({ error: 'Méthode de paiement non supportée' }, { status: 400 })
    }

    // Mettre à jour la commande avec l'ID de transaction
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        fedapay_transaction_id: paymentResult.id,
        payment_status: 'processing'
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      payment: paymentResult
    })

  } catch (error: any) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}
