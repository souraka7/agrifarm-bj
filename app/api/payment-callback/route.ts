import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/fedapay'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, status } = body

    if (!transaction_id) {
      return NextResponse.json({ error: 'Transaction ID manquant' }, { status: 400 })
    }

    const supabase = await createClient()

    // Vérifier le statut avec FedaPay
    const payment = await verifyPayment(transaction_id)

    // Mettre à jour la commande
    const { data: order } = await supabase
      .from('orders')
      .update({
        payment_status: payment.status,
        updated_at: new Date().toISOString()
      })
      .eq('fedapay_transaction_id', transaction_id)
      .select()
      .single()

    if (order && payment.status === 'completed') {
      // Notifier l'agriculteur
      // Envoyer un email de confirmation
      // Mettre à jour le stock, etc.
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Payment callback error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du traitement du callback' },
      { status: 500 }
    )
  }
}
