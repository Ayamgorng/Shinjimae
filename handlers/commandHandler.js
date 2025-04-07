import { PaymentService } from '../payment/service.js'

export async function handleCommand(text, user, sock) {
  const [cmd, ...args] = text.slice(1).split(' ')
  
  switch(cmd.toLowerCase()) {
    case 'bayar':
      return await handlePaymentCommand(args, user, sock)
      
    case 'upgrade':
      return await handleUpgrade(args, user)
      
    case 'stats':
      return `📊 Total Pesan Dihapus: ${sock.count}`
      
    default:
      return 'Perintah tidak dikenali'
  }
}

async function handlePaymentCommand(args, user, sock) {
  const [plan, method] = args
  const validMethods = ['dana', 'gopay', 'shopeepay']
  
  if (!validMethods.includes(method?.toLowerCase())) {
    return `Metode pembayaran tidak valid. Pilihan: ${validMethods.join(', ')}`
  }
  
  try {
    const pg = new PaymentService()
    const payment = await pg.createPayment(user, plan, method)
    
    let response = `💳 *Pembayaran ${plan.toUpperCase()}*
➖➖➖➖➖➖➖
📌 Metode: ${method.toUpperCase()}
💸 Jumlah: Rp${payment.amount.toLocaleString()}
⌛ Berlaku: ${pg.getPlanDuration(plan)} hari
➖➖➖➖➖➖➖`

    if (payment.qrCode) {
      await sock.sendMessage(user.jid, {
        image: { url: payment.qrCode },
        caption: response
      })
    }

    response += '\n\n' + payment.instructions.join('\n')
    await sock.sendMessage(user.jid, { text: response })

    return 'Silakan selesaikan pembayaran sesuai instruksi'
  } catch (error) {
    return `❌ Gagal memproses pembayaran: ${error.message}`
  }
}
