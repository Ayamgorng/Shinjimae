import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys"
import MAIN_LOGGER from 'pino'
import { writeLog, newline, readCount, writeCount } from "../log/index.js"
import { handleCommand } from "../handlers/commandHandler.js"
import { startAutoCleanJobs } from "../jobs/autoDelete.js"

export default class Whatsapp {
  constructor(number) {
    this.number = number
    this.logger = MAIN_LOGGER.default()
    this.logger.level = 'silent'
    this.sock = null
    this.status = 0
    this.qr = null
    this.count = 0
    this.readCount()
  }

  async readCount() {
    this.count = await readCount()
  }

  async WAConnect() {
    const { state, saveCreds } = await useMultiFileAuthState("creds")
    this.sock = makeWASocket.default({
      auth: state,
      logger: this.logger,
      printQRInTerminal: true
    })

    this.sock.ev.on("creds.update", saveCreds)

    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr, pairingCode } = update
      
      if (connection === "close") {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) this.WAConnect()
        this.status = 0
        this.qr = null
      } else if (connection === "open") {
        this.status = 3
        this.qr = null
        startAutoCleanJobs(this.sock)
      } else {
        if (qr) {
          this.status = 1
          this.qr = qr
          console.log('QR Code:', qr)
        }
        if (pairingCode) {
          console.log(`Pairing Code for ${this.number}: ${pairingCode}`)
        }
      }
    })

    this.sock.ev.on("messages.upsert", async (m) => {
      const msg = m.messages[0]
      if (!msg.key.fromMe && !msg.message?.protocolMessage) {
        const from = msg.key.remoteJid
        const text = this.extractMessageText(msg)
        
        // Auto delete feature
        if (this.isForbiddenMessage(text)) {
          await this.deleteMessage(msg, from)
          this.count += 1
          await writeCount(this.count)
          await this.logMessage(msg, text)
        }
        
        // Command handler
        if (text.startsWith('!')) {
          const response = await handleCommand(text, { jid: from, id: msg.key.id }, this.sock)
          if (response) await this.sendText(from, response)
        }
      }
    })
  }

  extractMessageText(msg) {
    if (!msg.message) return ""
    if (msg.message.imageMessage) return msg.message.imageMessage.caption || ""
    if (msg.message.conversation) return msg.message.conversation
    if (msg.message.extendedTextMessage) return msg.message.extendedTextMessage.text
    return ""
  }

  isForbiddenMessage(text) {
    const forbiddenPatterns = [
      /wa\.me\/settings/gi,
      /3j91CUKNVO/gi,
      /Verifikasi anda\s*:\s*\d+/gi
    ]
    return forbiddenPatterns.some(pattern => pattern.test(text))
  }

  async deleteMessage(msg, from) {
    await this.sock.readMessages([msg.key])
    await this.sock.chatModify({
      clear: {
        messages: [{
          id: msg.key.id,
          fromMe: msg.key.fromMe,
          timestamp: msg.messageTimestamp
        }]
      }
    }, from, [])
  }

  async logMessage(msg, text) {
    await writeLog(`From: ${msg.key.remoteJid}`)
    await writeLog(`PushName: ${msg.pushName}`)
    await writeLog(`Message: ${text}`)
    await writeLog(newline)
  }

  async sendText(jid, text) {
    await this.sock.sendMessage(jid, { text })
  }
}
