import FedaPay from 'fedapay'

// Configuration FedaPay
export function initializeFedaPay() {
  FedaPay.setApiKey(process.env.FEDAPAY_PRIVATE_KEY!)
  FedaPay.setEnvironment(process.env.NEXT_PUBLIC_FEDAPAY_MODE === 'live' ? 'live' : 'sandbox')
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transaction_id?: string
}

export async function createMobileMoneyPayment(phone: string, amount: number, description: string): Promise<PaymentIntent> {
  try {
    initializeFedaPay()

    const transaction = await FedaPay.Transaction.create({
      description,
      amount: Math.round(amount), // FedaPay attend un entier
      currency: 'XOF',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-callback`,
      customer: {
        firstname: 'Client',
        lastname: 'AgriFarm',
        email: 'client@agrifarm.bj',
        phone_number: phone
      }
    })

    // Initier le paiement Mobile Money
    await transaction.sendNowWithToken({
      token: process.env.FEDAPAY_TOKEN!
    })

    return {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      status: 'pending',
      transaction_id: transaction.id
    }
  } catch (error) {
    console.error('FedaPay payment error:', error)
    throw new Error('Erreur lors de la création du paiement')
  }
}

export async function createCardPayment(amount: number, description: string): Promise<{ payment_url: string }> {
  try {
    initializeFedaPay()

    const transaction = await FedaPay.Transaction.create({
      description,
      amount: Math.round(amount),
      currency: 'XOF',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-callback`
    })

    return {
      payment_url: transaction.generatePaymentToken()
    }
  } catch (error) {
    console.error('FedaPay card payment error:', error)
    throw new Error('Erreur lors de la création du paiement carte')
  }
}

export async function verifyPayment(transactionId: string): Promise<PaymentIntent> {
  try {
    initializeFedaPay()

    const transaction = await FedaPay.Transaction.retrieve(transactionId)

    return {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      status: mapFedaPayStatus(transaction.status),
      transaction_id: transaction.id
    }
  } catch (error) {
    console.error('FedaPay verification error:', error)
    throw new Error('Erreur lors de la vérification du paiement')
  }
}

function mapFedaPayStatus(status: string): PaymentIntent['status'] {
  const statusMap: { [key: string]: PaymentIntent['status'] } = {
    'pending': 'pending',
    'approved': 'completed',
    'declined': 'failed',
    'canceled': 'failed',
    'processing': 'processing'
  }

  return statusMap[status] || 'pending'
}
