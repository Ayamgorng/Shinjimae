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
