// payment/shopeepay.js
import axios from 'axios'
import crypto from 'crypto'

export class ShopeePayPayment {
  constructor() {
    this.partnerId = process.env.SHOPEE_PARTNER_ID
    this.secretKey = process.env.SHOPEE_SECRET_KEY
    this.baseUrl = process.env.SHOPEE_BASE_URL || 'https://api.wallet.airpay.co.id'
  }

  async generateSignature(params) {
    const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&')
    return crypto.createHmac('sha256', this.secretKey).update(sortedParams).digest('hex')
  }

  async createPayment(orderId, amount, user) {
    const params = {
      partner_id: this.partnerId,
      merchant_ext_id: process.env.MERCHANT_ID,
      store_ext_id: process.env.STORE_ID,
      amount,
      merchant_trade_no: orderId,
      return_url: `${process.env.BASE_URL}/payment/shopeepay/callback`
    }

    const signature = await this.generateSignature(params)

    try {
      const response = await axios.post(`${this.baseUrl}/qr/v2/create`, params, {
        headers: {
          'Authorization': signature
        }
      })

      return {
        qrCode: response.data.qr_code,
        deeplink: response.data.deeplink_url,
        instructions: [
          '1. Buka aplikasi Shopee',
          '2. Pilih ShopeePay',
          '3. Scan QR code atau klik link:',
          response.data.deeplink_url
        ]
      }
    } catch (error) {
      console.error('ShopeePay Error:', error.response?.data || error.message)
      throw new Error('Gagal membuat pembayaran ShopeePay')
    }
  }
}
