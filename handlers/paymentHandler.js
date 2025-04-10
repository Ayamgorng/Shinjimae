// handlers/paymentHandler.js
import { PaymentService } from './payment/service.js'
import { formatCurrency } from './utils/helpers.js'

export async function handlePaymentCommand(message, user, sock) {
  const args = message.split(' ')
  const [_, plan, method] = args

  const validMethods = ['dana', 'gopay', 'shopeepay']
  const validPlans = ['basic', 'premium', 'pro']

  // Validasi input
  if (!validPlans.includes(plan)) {
    return `❌ Paket tidak valid. Pilihan: ${validPlans.join(', ')}`
  }

  if (!validMethods.includes(method)) {
    return `❌ Metode tidak valid. Pilihan: ${validMethods.join(', ')}`
  }

  const paymentService = new PaymentService()
  
  try {
    const payment = await paymentService.createPayment(user, plan, method)
    
    // Format response
    let response = `💳 *Pembayaran ${plan.toUpperCase()}*
➖➖➖➖➖➖➖
📌 Metode: ${method.toUpperCase()}
💸 Jumlah: ${formatCurrency(payment.amount)}
⌛ Berlaku: ${paymentService.getPlanDuration(plan)} hari
➖➖➖➖➖➖➖`

    // Kirim QR Code jika ada
    if (payment.qrCode) {
      await sock.sendMessage(user.jid, {
        image: { url: payment.qrCode },
        caption: response
      })
    }

    // Tambahkan instruksi pembayaran
    response += '\n\n' + payment.instructions.join('\n')

    // Kirim deeplink sebagai button
    if (payment.deeplink) {
      response += `\n\nAtau klik link berikut:\n${payment.deeplink}`
    }

    await sock.sendMessage(user.jid, { text: response })

    return 'Silakan selesaikan pembayaran sesuai instruksi'
  } catch (error) {
    console.error('[PAYMENT] Command error:', error)
    return `❌ Gagal memproses pembayaran: ${error.message}`
  }
}
