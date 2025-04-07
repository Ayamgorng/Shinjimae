import { PaymentService } from '../payment/service.js'

const pg = new PaymentService()

export async function handleDanaWebhook(req, res) {
    try {
        const { orderId, status } = req.body
        
        if (status === 'SUCCESS') {
            await pg.verifyPayment(orderId)
            // TODO: Kirim notifikasi ke WhatsApp
        }
        
        res.status(200).json({ success: true })
    } catch (error) {
        console.error('DANA Webhook error:', error)
        res.status(400).json({ error: error.message })
    }
}

export async function handleGopayWebhook(req, res) {
    try {
        const { external_id, status } = req.body
        
        if (status === 'PAID') {
            await pg.verifyPayment(external_id)
            // TODO: Kirim notifikasi ke WhatsApp
        }
        
        res.status(200).json({ success: true })
    } catch (error) {
        console.error('Gopay Webhook error:', error)
        res.status(400).json({ error: error.message })
    }
}
