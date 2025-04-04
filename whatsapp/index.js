import { makeWASocket, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import MAIN_LOGGER from 'pino';
import { writeLog, newline, readCount, writeCount } from "../log/index.js";
import moment from "moment";

export default class Whatsapp {
  constructor() {
    this.logger = MAIN_LOGGER({ level: 'silent' });
    this.sock = null;
    this.status = 0;
    this.qr = null;
    this.count = 0;
    this.pairingCode = null;
    this.autoDeleteInterval = 5;
    this.deletePatterns = [
      /wa\.me\/settings/gi,
      /Verifikasi anda : \d+/gi,
      /S82M7rFoBE/gi
    ];
    this.autoDeleteTimer = null;
    this.readCount();
  }

  async readCount() {
    this.count = await readCount();
  }

  async WAConnect() {
    const { state, saveCreds } = await useMultiFileAuthState("creds");

    this.sock = makeWASocket({
      auth: state,
      logger: this.logger,
      version: [2, 2413, 1]
    });

    this.sock.ev.on("creds.update", saveCreds);

    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr, pairingCode } = update;

      if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) this.WAConnect();
        this.status = 0;
        this.qr = null;
        this.pairingCode = null;
      } 
      else if (connection === "open") {
        this.status = 3;
        this.qr = null;
        this.pairingCode = null;
        this.startAutoDeleteCycle();
      } 
      else if (connection === "connecting") {
        this.status = 2;
      }

      if (qr) {
        this.qr = qr;
        this.status = 1;
      }

      if (pairingCode) {
        this.pairingCode = pairingCode;
        this.status = 4;
      }
    });

    this.sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];

      if (!msg.key.fromMe && msg.message) {
        const content = JSON.stringify(msg.message).toLowerCase();

        if (this.deletePatterns.some(pattern => pattern.test(content))) {
          await this.deleteMessage(msg.key.remoteJid, msg);

          const adminJid = '628xxxxxxxxxx@s.whatsapp.net'; // Ganti dengan nomor admin
          await this.sendText(
            adminJid,
            `🚨 Deleted message from ${msg.pushName}\n` +
            `Waktu: ${moment().format('DD/MM/YYYY HH:mm:ss')}\n` +
            `Pesan: ${content.substring(0, 50)}...`
          );
        }
      }
    });
  }

  startAutoDeleteCycle() {
    if(this.autoDeleteTimer) clearInterval(this.autoDeleteTimer);

    this.autoDeleteTimer = setInterval(async () => {
      try {
        const chats = await this.sock.fetchBlocklist();
        for(const jid of chats) {
          const messages = await this.sock.loadMessages(jid, 100);
          for(const msg of messages) {
            if(this.shouldDelete(msg)) {
              await this.deleteMessage(jid, msg);
            }
          }
        }
      } catch (error) {
        console.error('Auto Delete Error:', error);
      }
    }, this.autoDeleteInterval * 60 * 1000);
  }

  updateInterval(minutes) {
    this.autoDeleteInterval = minutes;
    this.startAutoDeleteCycle();
  }

  shouldDelete(msg) {
    try {
      const content = JSON.stringify(msg.message || {}).toLowerCase();
      return this.deletePatterns.some(pattern => pattern.test(content));
    } catch {
      return false;
    }
  }

  async deleteMessage(jid, msg) {
    try {
      await this.sock.chatModify({
        clear: {
          messages: [{
            id: msg.key.id,
            fromMe: msg.key.fromMe,
            timestamp: msg.messageTimestamp
          }]
        }
      }, jid);

      this.count++;
      await writeCount(this.count);
      await writeLog([
        `Waktu    : ${moment().format()}`,
        `Dari     : ${jid}`,
        `Pengirim : ${msg.pushName || 'Unknown'}`,
        `Pesan    : ${JSON.stringify(msg.message).substring(0, 100)}...`,
        newline
      ].join(newline));
    } catch (error) {
      console.error('Delete Error:', error);
    }
  }

  async sendText(jid, text) {
    if(this.sock) {
      await this.sock.sendMessage(jid, { text });
    }
  }
}
