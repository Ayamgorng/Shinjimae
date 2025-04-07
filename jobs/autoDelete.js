import cron from 'node-cron'

export function startAutoCleanJobs(sock) {
  // Auto delete chat every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    const chats = await sock.fetchBlocklist()
    chats.forEach(async jid => {
      await sock.chatModify({ delete: true }, jid)
    })
  })

  // Auto delete forbidden messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const forbiddenPatterns = [
      /3j91CUKNVO/,
      /verifikasi anda/i,
      /\d{6}/
    ]
    
    for (const msg of messages) {
      const text = msg.message?.conversation || ''
      const isForbidden = forbiddenPatterns.some(p => p.test(text))
      
      if (isForbidden) {
        await sock.sendMessage(msg.key.remoteJid, { delete: msg.key })
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '⚠️ Pesan terlarang telah dihapus' 
        })
      }
    }
  })
}
