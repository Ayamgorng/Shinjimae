import Server from "./server/index.js"
import Whatsapp from "./whatsapp/index.js"
import QRCode from "qrcode"
import fs from "fs"
import { check } from "./log/index.js"
import readline from 'readline'
import { startPaymentScheduler } from './jobs/paymentScheduler.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const port = process.env.PORT || 8080

rl.question('Masukkan Nomor WhatsApp (contoh: 628123456789): ', (number) => {
  const WhatsappInterface = new Whatsapp(number)
  WhatsappInterface.WAConnect()
  startServer(WhatsappInterface)
  startPaymentScheduler()
})

function startServer(WhatsappInterface) {
  const ServerInterface = new Server(port, WhatsappInterface)

  ServerInterface.app.get("/status", (req, res) => {
    let data = {
      status: "OK",
      whatsapp: WhatsappInterface.status == 0 ? "Close" : 
               WhatsappInterface.status == 1 ? "QR" : 
               WhatsappInterface.status == 2 ? "Connecting" : "Open"
    }
    res.send(JSON.stringify(data))
  })

  ServerInterface.app.get("/qr", async (req, res) => {
    let isQR = WhatsappInterface.qr ? true : false
    if (isQR) {
      let dataurl = await QRCode.toDataURL(WhatsappInterface.qr)
      res.send(`<head><meta http-equiv="refresh" content="3"></head>
               <img src="${dataurl}" width="30%">`)
    } else if (WhatsappInterface.status == 2) {
      res.send('<head><meta http-equiv="refresh" content="3"></head>Connecting')
    } else {
      res.send('<script>document.location.href = "/"</script>')
    }
  })

  ServerInterface.app.get("/", async (req, res) => {
    if (WhatsappInterface.status !== 3) {
      res.redirect(302, "./qr")
    } else {
      let html = fs.readFileSync("./public/index.html")
      res.send(html.toString())
    }
  })

  ServerInterface.app.get("/count", (req, res) => {
    res.send(JSON.stringify({
      status: "OK",
      count: WhatsappInterface.count
    }))
  })

  ServerInterface.app.get("/log", async (req, res) => {
    let logFile = "./cache_log/log.txt"
    let c = await check(logFile)
    if (!c) {
      res.status(500).send("Log File not Exists")
    } else {
      let read = fs.readFileSync(logFile)
      res.status(200).send(`<pre>${read.toString()}</pre>`)
    }
  })
}
