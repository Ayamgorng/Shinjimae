import express from "express"; // FIX: Heroku crash karena ini belum diimport
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
ServerInterface.server.use(express.static('public'));

ServerInterface.server.get("/status", (req, res) => {
  let data = {
    status: "OK",
    whatsapp: WhatsappInterface.status == 0 ? "Close" : 
             WhatsappInterface.status == 1 ? "QR" : 
             WhatsappInterface.status == 2 ? "Connecting" : 
             WhatsappInterface.status == 4 ? "Pairing Code" : "Open",
    interval: WhatsappInterface.autoDeleteInterval
  };
  res.json(data);
});

ServerInterface.server.get("/qr", async (req, res) => {
  try {
    if(WhatsappInterface.status === 4) {
      res.send(`
        <h2>Pairing Code: ${WhatsappInterface.pairingCode}</h2>
        <p>Masukkan kode di WhatsApp > Perangkat Tertaut > Tautkan Perangkat</p>
        <meta http-equiv="refresh" content="10">
      `);
    } else if(WhatsappInterface.qr) {
      const dataurl = await QRCode.toDataURL(WhatsappInterface.qr);
      res.send(`
        <head>
          <meta http-equiv="refresh" content="3">
          <style>img { border: 10px solid #333; border-radius: 15px; }</style>
        </head>
        <img src="${dataurl}" width="40%">
      `);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    res.status(500).send("Error generating QR");
  }
});

ServerInterface.server.post('/config/interval', (req, res) => {
  const minutes = parseInt(req.body.minutes);
  if(minutes >= 1 && minutes <= 60) {
    WhatsappInterface.updateInterval(minutes);
    res.json({ status: "OK", new_interval: minutes });
  } else {
    res.status(400).json({ error: "Invalid interval (1-60 minutes)" });
  }
});

ServerInterface.server.get("/", (req, res) => {
  if(WhatsappInterface.status !== 3) {
    res.redirect('/qr');
  } else {
    const html = fs.readFileSync("./public/index.html", "utf-8");
    res.send(html);
  }
});

ServerInterface.server.get("/count", async(req, res) => {
    let struct = {
        status: "OK",
        count: WhatsappInterface.count
    }
    res.send(JSON.stringify(struct));
});

ServerInterface.server.get("/log", async(req, res) => {
    let logFile = "./cache_log/log.txt";
    let c = await check(logFile);
    if(!c){
        res.status(500).send("Log File not Exists");
    } else {
        let read = fs.readFileSync(logFile);
        read = Buffer.from(read).toString("utf-8");
        res.status(200).send("<pre>"+read+"</pre>");
    }
});
