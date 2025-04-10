// payment/gopay.js
import axios from 'axios'

export class GopayPayment {
  constructor() {
    this.apiKey = process.env.GOPAY_API_KEY
    this.baseUrl = process.env.GOPAY_BASE_URL || 'https://api.gojekapi.com'
  }

  async createPayment(orderId, amount, user) {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/payments`, {
        external_id: orderId,
        amount,
        payer_email: user.email,
        description: `Pembayaran Premium Bot`,
        callback_url: `${process.env.BASE_URL}/payment/gopay/callback`
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-AppVersion': '4.59.1',
          'X-Platform': 'Android'
        }
      })

      return {
        deeplink: response.data.actions.mobile_deeplink,
        qrCode: response.data.qr_code,
        instructions: [
          '1. Buka aplikasi Gojek',
          '2. Pilih Bayar',
          '3. Scan QR code berikut atau klik link:',
          response.data.actions.mobile_deeplink
        ]
      }
    } catch (error) {
      console.error('Gopay Payment Error:', error.response?.data || error.message)
      throw new Error('Gagal membuat pembayaran GoPay')
    }
  }
}
