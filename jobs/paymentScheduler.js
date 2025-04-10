// jobs/paymentScheduler.js
import cron from 'node-cron'
import { PaymentService } from './payment/service.js'

export function startPaymentScheduler() {
  // Setiap jam memeriksa pembayaran yang expired
  cron.schedule('0 * * * *', async () => {
    const paymentService = new PaymentService()
    await paymentService.db.read()
    
    const now = new Date()
    const expiredPayments = paymentService.db.data.payments.filter(
      p => p.status === 'pending' && new Date(p.expiresAt) < now
    )
    
    expiredPayments.forEach(p => {
      p.status = 'expired'
    })
    
    await paymentService.db.write()
  })

  // Setiap 5 menit verifikasi pembayaran pending
  cron.schedule('*/5 * * * *', async () => {
    const paymentService = new PaymentService()
    await paymentService.db.read()
    
    const pendingPayments = paymentService.db.data.payments.filter(
      p => p.status === 'pending'
    )
    
    for (const payment of pendingPayments) {
      try {
        const status = await paymentService.providers[payment.method]
          .verifyPayment(payment.id)
        
        if (status === 'success') {
          await paymentService.activateSubscription(
            payment.userId, 
            payment.plan
          )
          payment.status = 'completed'
          await paymentService.db.write()
        }
      } catch (error) {
        console.error(`[SCHEDULER] Error verifying ${payment.id}:`, error)
      }
    }
  })
}
