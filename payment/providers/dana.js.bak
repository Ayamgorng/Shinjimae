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

  async createPayment({ paymentId, amount, user, callbackUrl }) {
    const payload = {
      merchantId: this.config.merchantId,
      orderId: paymentId,
      amount: amount.toString(),
      callbackUrl,
      customer: {
        name: user.username,
        email: user.email,
        phone: user.phone
      }
    }

    const headers = await this.generateHeaders(JSON.stringify(payload))
    
    try {
      const { data } = await axios.post(
        `${this.config.baseUrl}/v2/payment`,
        payload,
        { headers }
      )

      return {
        paymentUrl: data.paymentUrl,
        deeplink: data.deeplinkUrl,
        qrCode: data.qrCodeUrl,
        instructions: [
          '1. Buka aplikasi DANA',
          '2. Pilih Bayar',
          `3. Gunakan QR Code atau klik: ${data.deeplinkUrl}`,
          '4. Selesaikan pembayaran'
        ]
      }
    } catch (error) {
      console.error('DANA Error:', error.response?.data || error.message)
      throw new Error('Gagal memproses pembayaran DANA')
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
      'Signature': signature
    }
  }
}
