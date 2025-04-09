import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { DanaPayment } from '../providers/dana.js'
import { GopayPayment } from '../providers/gopay.js'
import { ShopeePayPayment } from '../providers/shopeepay.js'
import { v4 as uuidv4 } from 'uuid'

const adapter = new JSONFile('db/payments.json')
const db = new Low(adapter)

export class PaymentService {
  constructor() {
    this.providers = {
      dana: new DanaPayment(),
      gopay: new GopayPayment(),
      shopeepay: new ShopeePayPayment()
    }
    this.initializeDB()
  }

  async initializeDB() {
    await db.read()
    db.data ||= { payments: [], subscriptions: [] }
  }

  async createPayment(user, plan, method) {
    const paymentId = `PAY-${uuidv4()}`
    const amount = this.getPlanPrice(plan)
    
    const paymentData = {
      id: paymentId,
      userId: user.id,
      amount,
      plan,
      method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }

    try {
      const providerResponse = await this.providers[method].createPayment({
        paymentId,
        amount,
        user,
        callbackUrl: `${process.env.BASE_URL}/payment/${method}/callback`
      })

      paymentData.providerData = providerResponse
      db.data.payments.push(paymentData)
      await db.write()

      return {
        ...providerResponse,
        paymentId,
        amount,
        paymentMethod: method
      }
    } catch (error) {
      console.error(`Payment error (${method}):`, error)
      throw error
    }
  }
  
  getPlanPrice(plan) {
    const prices = { basic: 29000, premium: 99000, pro: 199000 }
    return prices[plan] || 0
  }
}
