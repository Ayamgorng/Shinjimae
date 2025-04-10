import express from "express";

export default class Server {
  constructor(port) {
    // Gunakan port dari environment variable jika tersedia (Replit/Heroku)
    const resolvedPort = process.env.PORT || port || 8080;

    this.server = express();

    // Rute contoh
    this.server.get("/", (req, res) => {
      res.send("Server is running!");
    });

    // Mulai mendengarkan di port yang ditentukan
    this.listen = this.server.listen(resolvedPort, () => {
      console.log(`Server running on http://localhost:${resolvedPort}`);
      console.log(`Buka http://localhost:${resolvedPort}/qr untuk QR Auth`);
    });
  }
}
