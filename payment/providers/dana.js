// payment/providers/dana.js
import axios from 'axios'
import crypto from 'crypto'

export class DanaPayment {
  constructor() {
    this.config = {
      clientId: process.env.DANA_CLIENT_ID,
      clientSecret: process.env.DANA_CLIENT_SECRET,
      merchantId: process.env.DANA_MERCHANT_ID,
      baseUrl: process.env.DANA_BASE_URL || 'https://api-sandbox.dana.id'
    }
  }

  async generateHeaders(payload) {
    const timestamp = new Date().toISOString()
    const stringToSign = `${this.config.clientId}|${timestamp}|${payload}`
    const signature = crypto.createHmac('sha256', this.config.clientSecret)
      .update(stringToSign)
      .digest('hex')

    return {
      'Client-Id': this.config.clientId,
      'Request-Time': timestamp,
      'Signature': signature,
      'Content-Type': 'application/json'
    }
  }

  async createPayment({ paymentId, amount, user, callbackUrl }) {
    const payload = {
      merchantId: this.config.merchantId,
      orderId: paymentId,
      amount: amount.toString(),
      currency: 'IDR',
      goods: {
        name: `Langganan ${user.plan} Bot WhatsApp`,
        price: amount.toString()
      },
      callbackUrl,
      customer: {
        id: user.id,
        name: user.username,
        email: user.email,
        phone: user.phone.replace(/^0/, '62')
      }
    }

    const headers = await this.generateHeaders(JSON.stringify(payload))

    try {
      const { data } = await axios.post(
        `${this.config.baseUrl}/v2/payment/create`,
        payload,
        { headers }
      )

      return {
        paymentUrl: data.paymentUrl,
        deeplink: data.deeplinkUrl,
        qrCode: data.qrCodeUrl,
        providerReference: data.referenceId,
        instructions: this.getInstructions(data.deeplinkUrl)
      }
    } catch (error) {
      console.error('[DANA] Payment error:', error.response?.data || error.message)
      throw this.handleError(error)
    }
  }

  async verifyPayment(paymentId) {
    const headers = await this.generateHeaders(JSON.stringify({ orderId: paymentId }))
    
    try {
      const { data } = await axios.get(
        `${this.config.baseUrl}/v2/payment/status`,
        {
          params: { orderId: paymentId },
          headers
        }
      )

      return data.transactionStatus === 'SUCCESS' ? 'success' : 'pending'
    } catch (error) {
      console.error('[DANA] Verification error:', error)
      return 'failed'
    }
  }

  getInstructions(deeplink) {
    return [
      '📌 *Instruksi Pembayaran DANA*',
      '1. Buka aplikasi DANA di perangkat Anda',
      '2. Tekan tombol "Bayar"',
      `3. Buka link berikut: ${deeplink}`,
      '4. Ikuti petunjuk di aplikasi untuk menyelesaikan pembayaran',
      '',
      '⚠️ Batas waktu pembayaran: 1 jam'
    ]
  }

  handleError(error) {
    const danaErrors = {
      'LIMIT_EXCEEDED': 'Batas pembayaran harian terlampaui',
      'INVALID_AMOUNT': 'Jumlah pembayaran tidak valid',
      'TRANSACTION_FAILED': 'Transaksi gagal di proses DANA'
    }
    
    return new Error(
      danaErrors[error.response?.data?.code] || 
      'Terjadi kesalahan saat memproses pembayaran DANA'
    )
  }
}
