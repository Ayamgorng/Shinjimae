// payment/index.js
async function checkPaymentStatus(orderId, method) {
  try {
    switch(method.toLowerCase()) {
      case 'dana':
        return await this.dana.checkStatus(orderId)
      
      case 'gopay':
        return await this.gopay.checkStatus(orderId)
      
      case 'shopeepay':
        return await this.shopeepay.checkStatus(orderId)
      
      default:
        throw new Error('Metode tidak valid')
    }
  } catch (error) {
    console.error('Check Status Error:', error)
    return { status: 'unknown' }
  }
}

// server/index.js
// Callback DANA
this.app.post('/payment/dana/callback', async (req, res) => {
  try {
    const { orderId, status } = req.body
    await this.handlePaymentStatus(orderId, status, 'DANA')
    res.status(200).send('OK')
  } catch (error) {
    res.status(500).send('Error')
  }
})

// Callback GoPay
this.app.post('/payment/gopay/callback', async (req, res) => {
  try {
    const { external_id, status } = req.body
    await this.handlePaymentStatus(external_id, status, 'GOPAY')
    res.status(200).send('OK')
  } catch (error) {
    res.status(500).send('Error')
  }
})

// Callback ShopeePay
this.app.post('/payment/shopeepay/callback', async (req, res) => {
  try {
    const { merchant_trade_no, status } = req.body
    await this.handlePaymentStatus(merchant_trade_no, status, 'SHOPEEPAY')
    res.status(200).send('OK')
  } catch (error) {
    res.status(500).send('Error')
  }
})

// Contoh implementasi di DANA
// payment/dana.js
async checkStatus(orderId) {
  const payload = { orderId }
  const signature = await this.generateSignature(JSON.stringify(payload))
  
  const response = await axios.get(`${this.baseUrl}/v1/payment/status`, {
    params: payload,
    headers: {
      'Client-Id': this.clientId,
      'Request-Time': new Date().toISOString(),
      'Signature': signature
    }
  })
  
  return {
    status: response.data.status === 'SUCCESS' ? 'success' : 'pending',
    data: response.data
  }
}
