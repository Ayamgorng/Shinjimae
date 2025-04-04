import express from "express";
import Server from "./server/index.js";
import Whatsapp from "./whatsapp/index.js";
import QRCode from "qrcode";
import fs from "fs";
import { check } from "./log/index.js";
import bodyParser from "body-parser";
import helmet from "helmet";

const port = process.env.PORT || 8080;

const ServerInterface = new Server(port);
const WhatsappInterface = new Whatsapp();
WhatsappInterface.WAConnect();

ServerInterface.server.use(bodyParser.json());
ServerInterface.server.use(express.static("public"));
ServerInterface.server.use(helmet());

// STATUS ENDPOINT
ServerInterface.server.get("/status", (req, res) => {
  let data = {
    status: "OK",
    whatsapp:
      WhatsappInterface.status == 0
        ? "Close"
        : WhatsappInterface.status == 1
        ? "QR"
        : WhatsappInterface.status == 2
        ? "Connecting"
        : WhatsappInterface.status == 4
        ? "Pairing Code"
        : "Open",
    interval: WhatsappInterface.autoDeleteInterval,
  };
  res.json(data);
});

// QR PAGE - Diperbarui
ServerInterface.server.get("/qr", async (req, res) => {
  try {
    let content = "";

    if (WhatsappInterface.status === 4 && WhatsappInterface.pairingCode) {
      content = `
        <h2>Pairing Code:</h2>
        <h1>${WhatsappInterface.pairingCode}</h1>
        <p>Masukkan kode di WhatsApp > Perangkat Tertaut > Tautkan Perangkat</p>
        <meta http-equiv="refresh" content="10">
      `;
    } else if (WhatsappInterface.qr) {
      const dataurl = await QRCode.toDataURL(WhatsappInterface.qr);
      content = `
        <h2>Scan QR Code dengan WhatsApp</h2>
        <img src="${dataurl}" width="300">
        <p>QR akan refresh otomatis</p>
        <meta http-equiv="refresh" content="5">
      `;
    } else {
      content = `
        <p>QR belum tersedia. Tunggu beberapa detik lalu refresh halaman ini.</p>
        <meta http-equiv="refresh" content="3">
      `;
    }

    res.send(`
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body { 
              font-family: sans-serif; 
              text-align: center; 
              margin-top: 80px; 
              background: #f4f4f4;
              color: #222;
            }
            img { 
              border: 8px solid #555; 
              border-radius: 12px; 
              margin-top: 20px;
            }
            h1, h2 { margin-bottom: 10px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
  } catch (error) {
    console.error("QR Error:", error);
    res.status(500).send("Terjadi kesalahan saat membuat QR");
  }
});

// QR TEXT ENDPOINT (baru)
ServerInterface.server.get("/qr/text", (req, res) => {
  if (WhatsappInterface.status === 1 && WhatsappInterface.qr) {
    res.json({ status: "OK", qr: WhatsappInterface.qr });
  } else {
    res.json({ status: "WAITING", message: "QR belum tersedia" });
  }
});

// SET INTERVAL
ServerInterface.server.post("/config/interval", (req, res) => {
  const minutes = parseInt(req.body.minutes);
  if (minutes >= 1 && minutes <= 60) {
    WhatsappInterface.updateInterval(minutes);
    res.json({ status: "OK", new_interval: minutes });
  } else {
    res.status(400).json({ error: "Invalid interval (1-60 minutes)" });
  }
});

// HOME PAGE
ServerInterface.server.get("/", (req, res) => {
  if (WhatsappInterface.status !== 3) {
    res.redirect("/qr");
  } else {
    const html = fs.readFileSync("./public/index.html", "utf-8");
    res.send(html);
  }
});

// COUNT DELETED MESSAGES
ServerInterface.server.get("/count", async (req, res) => {
  let struct = {
    status: "OK",
    count: WhatsappInterface.count,
  };
  res.send(JSON.stringify(struct));
});

// LOG FILE VIEWER
ServerInterface.server.get("/log", async (req, res) => {
  let logFile = "./cache_log/log.txt";
  let c = await check(logFile);
  if (!c) {
    res.status(500).send("Log File not Exists");
  } else {
    let read = fs.readFileSync(logFile);
    read = Buffer.from(read).toString("utf-8");
    res.status(200).send("<pre>" + read + "</pre>");
  }
});
