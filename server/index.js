import express from "express";

export default class Server {
  constructor(port) {
    this.server = express();

    // Tambah route dasar (opsional)
    this.server.get("/", (req, res) => {
      res.send("Server initialized.");
    });

    // Jangan lakukan .listen() di sini! Biarkan index.js yang handle itu.
  }
}
