# About Shinjimae Bot
A Simple Whatsapp bot that can delete incoming messages if contains ```wa.me/settings``` automatically

# Installing and Run
1. ```git clone https://github.com/AzumiSensei/Shinjimae```
2. ```npm install```
3. ```npm run start```

# QR Auth
1. Open ```http://localhost:1000/qr``` in browser
2. Then scan the QR code

# About Author
Saya Pemula 🙏

## Heroku Deployment
1. Create new Heroku app
2. Connect your GitHub repository
3. Add buildpack: `heroku/nodejs`
4. Enable automatic deploys
5. Open app in browser and use QR/Pairing code

## Configuration
- Send POST to `/config/interval` with JSON body:
```json
{"minutes": 5}



# About Shinjimae Bot (v2.0)
WhatsApp Bot dengan fitur:
- Auto delete pesan mengandung `wa.me/settings` atau pola verifikasi
- Dapat diatur interval auto delete (default 5 menit)
- Support QR Code dan Pairing Code
- Compatible dengan WhatsApp terbaru

## Heroku Deployment
1. Buat app baru di Heroku
2. Connect ke GitHub repository
3. Tambahkan buildpack: `heroku/nodejs`
4. Enable automatic deploys
5. Buka app di browser dan scan QR/masukkan pairing code

## Konfigurasi
- Kiram POST request ke `/config/interval` dengan JSON:
```json
{"minutes": 5}
