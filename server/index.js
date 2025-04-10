import express from 'express'
import { login, register } from './auth/index.js'
import { authMiddleware, adminMiddleware } from './middleware/admin.js'
import { handleDanaWebhook, handleGopayWebhook } from './webhooks.js'

export default class Server {
  constructor(port, whatsapp) {
    this.app = express()
    this.app.use(express.json())
    this.whatsapp = whatsapp

    // Auth routes
    this.app.post('/api/login', async (req, res) => {
      try {
        const result = await login(req.body)
        res.json(result)
      } catch (err) {
        res.status(400).json({ error: err.message })
      }
    })

    this.app.post('/api/register', async (req, res) => {
      try {
        const result = await register(req.body)
        res.json(result)
      } catch (err) {
        res.status(400).json({ error: err.message })
      }
    })

    // Payment webhooks
    this.app.post('/payment/dana/callback', handleDanaWebhook)
    this.app.post('/payment/gopay/callback', handleGopayWebhook)

    // Admin routes
    this.app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
      res.json({
        users: db.data.users.length,
        groups: db.data.groups.length,
        messagesDeleted: this.whatsapp.count
      })
    })

    this.server = this.app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  }
}
