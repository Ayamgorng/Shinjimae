import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import MAIN_LOGGER from "pino";
import fs from "fs";
import { writeLog, newline, readCount, writeCount } from "../log/index.js";

export default class Whatsapp {
  constructor() {
    this.logger = MAIN_LOGGER.default();
    this.logger.level = "silent";
    this.sock = null;
    this.status = 0;
    this.qr = null;
    this.pairing = null;
    this.count = 0;

    // Array untuk menyimpan pesan pending deletion
    this.pendingDeletion = [];

    // Konfigurasi auto delete (default)
    this.autoDelete = true;
    this.autoDeleteInterval = 5; // dalam menit
    this.autoDeleteTimer = null;
    this.autoDeleteVerificationEnabled = true;
    this.verificationKeywords = ["verifikasi", "otp", "verification"];

    this.readCount();

    // Load konfigurasi auto delete dari file config
    this.loadConfig();
  }

  async readCount(){
    this.count = await readCount();
  }

  async WAConnect() {
    const { state, saveCreds } = await useMultiFileAuthState("creds");
    this.sock = makeWASocket.default({
      auth: state,
      logger: this.logger
    });

    this.sock.ev.on("creds.update", saveCreds);

    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        const reconnect = lastDisconnect.error?.output?.payload?.statusCode !== DisconnectReason.loggedOut;
        if (reconnect) {
          this.WAConnect();
        }
        this.status = 0;
        this.qr = null;
        this.pairing = null;
      }
      else if (connection === "open") {
        this.status = 3;
        this.qr = null;
        this.pairing = null;
      }
      else {
        if(update.qr) {
          this.status = 1;
          this.qr = update.qr;
          this.pairing = null;
        }
        else if(update.pairingCode) {
          this.status = 1;
          this.pairing = update.pairingCode;
          this.qr = null;
        }
        else {
          this.status = 3;
          this.qr = null;
          this.pairing = null;
        }
      }
    });

    this.sock.ev.on("messages.upsert", async (m) => {
      let msgObj = m.messages[0];
      let isRevoked = msgObj.hasOwnProperty("message")
                        ? msgObj.message.hasOwnProperty("protocolMessage")
                          ? true : false
                        : false;
      // Proses hanya jika pesan bukan dari kita sendiri
      if (!msgObj.key.fromMe) {
        if (!isRevoked) {
          let isMessage = msgObj.hasOwnProperty("message");
          let isImage = isMessage ? msgObj.message.hasOwnProperty("imageMessage") : false;
          let from = msgObj.key.remoteJid;
          let msg = "";
          if(isMessage) {
            if(isImage) {
              msg = msgObj.message.imageMessage.caption || "";
            } else if(msgObj.message.hasOwnProperty("conversation")){
              msg = msgObj.message.conversation;
            } else if(msgObj.message.hasOwnProperty("extendedTextMessage")){
              msg = msgObj.message.extendedTextMessage.text;
            }
          }

          // Cek pesan dengan "wa.me/settings" untuk dihapus langsung
          let regexSettings = /wa\.me\/settings/gi;
          if (regexSettings.test(msg)) {
            await this.sock.readMessages([msgObj.key]);
            await this.sock.chatModify({
              clear: {
                messages: [{
                  id: msgObj.key.id,
                  fromMe: msgObj.key.fromMe,
                  timestamp: msgObj.messageTimestamp
                }]
              }
            }, from, []);
            this.count += 1;
            await writeCount(this.count);
            await writeLog("From        : " + msgObj.key.remoteJid);
            await writeLog("PushName    : " + msgObj.pushName);
            await writeLog("Message     : " + msg);
            await writeLog(newline);
            return;
          }

          // Cek pesan verifikasi berdasarkan kata kunci
          let isVerification = false;
          if(this.autoDeleteVerificationEnabled) {
            for(let keyword of this.verificationKeywords) {
              let regexVerif = new RegExp(keyword, "i");
              if(regexVerif.test(msg)) {
                isVerification = true;
                break;
              }
            }
          }
          if(isVerification) {
            await this.sock.readMessages([msgObj.key]);
            await this.sock.chatModify({
              clear: {
                messages: [{
                  id: msgObj.key.id,
                  fromMe: msgObj.key.fromMe,
                  timestamp: msgObj.messageTimestamp
                }]
              }
            }, from, []);
            this.count += 1;
            await writeCount(this.count);
            await writeLog("Auto delete (verifikasi) - From : " + msgObj.key.remoteJid);
            return;
          }

          // Untuk pesan lain, jika auto delete aktif, simpan ke pendingDeletion
          if(this.autoDelete) {
            this.pendingDeletion.push({
              key: msgObj.key,
              jid: from,
              timestamp: Date.now() // waktu terima pesan
            });
          }

          // Respons untuk pesan "@isalive"
          if(msg.trim() === "@isalive") {
            await this.sock.readMessages([msgObj.key]);
            setTimeout(() => this.sendText(from, "I am still Alive"), 1300);
          }
        }
      }
    });
  }

  /**
   * Load konfigurasi auto delete dari file config
   */
  loadConfig() {
    const path = "./cache_log/config.json";
    if (fs.existsSync(path)) {
      let data = JSON.parse(fs.readFileSync(path));
      this.autoDelete = data.autoDelete;
      this.autoDeleteInterval = data.interval;
      this.startAutoDelete();
    }
  }

  /**
   * Update konfigurasi auto delete secara dinamis
   */
  updateAutoDeleteConfig(config) {
    this.autoDelete = config.autoDelete;
    this.autoDeleteInterval = config.interval;
    this.startAutoDelete();
  }

  /**
   * Mulai proses auto delete berdasarkan interval yang disetting
   */
  startAutoDelete() {
    if (this.autoDeleteTimer) clearInterval(this.autoDeleteTimer);

    if (this.autoDelete) {
      this.autoDeleteTimer = setInterval(async () => {
        let now = Date.now();
        let remaining = [];
        for (let pending of this.pendingDeletion) {
          if (now - pending.timestamp >= this.autoDeleteInterval * 60000) {
            try {
              await this.sock.readMessages([pending.key]);
              await this.sock.chatModify({
                clear: {
                  messages: [{
                    id: pending.key.id,
                    fromMe: pending.key.fromMe,
                    timestamp: pending.timestamp / 1000
                  }]
                }
              }, pending.jid, []);
              this.count += 1;
              await writeCount(this.count);
              await writeLog("Auto delete (periodik) - From: " + pending.jid);
            } catch(e) {
              await writeLog("Error auto deleting pesan: " + e);
              remaining.push(pending);
            }
          } else {
            remaining.push(pending);
          }
        }
        this.pendingDeletion = remaining;
      }, 60000);
    }
  }

  getCount() {
    return this.count;
  }

  async sendText(jid, str) {
    await this.sock.sendMessage(jid, { text: str });
  }
                    }
