import express from "express";
import Server from "./server/index.js";
import Whatsapp from "./whatsapp/index.js";
import QRCode from "qrcode";
import fs from "fs";
import { check } from "./log/index.js";

//const port = 8080; // Port server untuk selain heroku
// Gunakan port yang diberikan oleh Heroku atau default ke 8080 (misalnya untuk lokal)
const port = process.env.PORT || 8080;

// Inisialisasi server dan Whatsapp
const ServerInterface = new Server(port);
const WhatsappInterface = new Whatsapp();
WhatsappInterface.WAConnect();

// Menjadikan server mendengarkan pada 0.0.0.0 agar dapat diakses secara public
ServerInterface.server.listen(port, "0.0.0.0", () => {
  console.log(`Server berjalan dan dapat diakses secara public pada http://0.0.0.0:${port}`);
});

// Endpoint baru untuk konfigurasi auto delete
const configFile = "./cache_log/config.json";

ServerInterface.server.get("/config", (req, res) => {
  if (fs.existsSync(configFile)) {
    let data = fs.readFileSync(configFile);
    res.json(JSON.parse(data));
  } else {
    res.json({ autoDelete: true, interval: 5 });
  }
});

ServerInterface.server.post("/config", express.json(), (req, res) => {
  let config = {
    autoDelete: req.body.autoDelete ?? true,
    interval: req.body.interval ?? 5
  };

  fs.writeFileSync(configFile, JSON.stringify(config));
  WhatsappInterface.updateAutoDeleteConfig(config);
  res.status(200).send("OK");
});

ServerInterface.server.get("/status", (req, res) => {
  let data = {
    status: "OK",
    whatsapp: WhatsappInterface.status === 0 ? "Close" :
              WhatsappInterface.status === 1 ? "QR/Pairing" :
              WhatsappInterface.status === 2 ? "Connecting" : "Open"
  };
  res.send(JSON.stringify(data));
});

ServerInterface.server.get("/qr", async (req, res) => {
  let isQR = WhatsappInterface.qr ? true : false;
  if (isQR) {
    let dataurl = await QRCode.toDataURL(WhatsappInterface.qr);
    res.send("<head> <meta http-equiv=\"refresh\" content=\"3\"> </head><img src=\"" + dataurl + "\" width=\"30%\">");
  }
  else if (WhatsappInterface.status === 2) {
    res.send("<head> <meta http-equiv=\"refresh\" content=\"3\"> </head>Connecting");
  }
  else {
    res.send("<script type='text/javascript'>document.location.href = '/'</script>");
  }
});

ServerInterface.server.get("/pairing", async (req, res) => {
  if (WhatsappInterface.pairing) {
    res.send("<head> <meta http-equiv=\"refresh\" content=\"5\"> </head><p>Pairing Code: " + WhatsappInterface.pairing + "</p>");
  }
  else {
    res.send("<script type='text/javascript'>document.location.href = '/qr'</script>");
  }
});

ServerInterface.server.get("/", async (req, res) => {
  if (WhatsappInterface.status !== 3) {
    res.redirect(302, "./qr");
  }
  else {
    let html = fs.readFileSync("./public/index.html");
    html = Buffer.from(html).toString("utf-8");
    res.send(html);
  }
});

ServerInterface.server.get("/count", async (req, res) => {
  let struct = {
    status: "OK",
    count: WhatsappInterface.count
  };
  res.send(JSON.stringify(struct));
});

ServerInterface.server.get("/log", async (req, res) => {
  let logFile = "./cache_log/log.txt";
  let c = await check(logFile);
  if (!c) {
    res.status(500).send("Log File not Exists");
  }
  else {
    let read = fs.readFileSync(logFile);
    read = Buffer.from(read).toString("utf-8");
    res.status(200).send("<pre>" + read + "</pre>");
  }
});
