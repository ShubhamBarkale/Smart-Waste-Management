# Connecting the ESP32 to the dashboard

## 1. Server
```bash
cd server
cp .env.example .env          # then edit .env
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # paste result as DEVICE_API_KEY
npm install
node seed.js                  # optional demo data (also creates admin@smartwaste.com / admin123)
npm start
```
MongoDB must be running (or put a MongoDB Atlas URL in `MONGO_URI`).

## 2. Dashboard
```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```
Log in. The header pill must say **● Live** – that means the browser is connected to the server for push updates.

## 3. Test WITHOUT hardware (curl)
```bash
curl -X POST http://localhost:5000/api/bins/update \
  -H "Content-Type: application/json" -H "x-api-key: YOUR_DEVICE_API_KEY" \
  -d '{"binId":"SHR-001","fillPercentage":55,"lat":19.7653,"lng":74.4762}'
```
Try 55, then 62, then 93 with the dashboard open: you should see a toast + beep for each level
(50 Half full, 60 Warning, 90 Bin full) and the bin card/map marker change colour without refreshing.
At 90 a collection task is created automatically.

## 4. ESP32
1. Open `firmware/esp32_smart_bin/esp32_smart_bin.ino` in Arduino IDE (board package: *esp32 by Espressif*).
2. Edit the **EDIT THESE** block: Wi-Fi, `SERVER_URL` (your PC's LAN IP, e.g. `http://192.168.1.50:5000/...`), `API_KEY`, `BIN_ID`, lat/lng, and the two calibration distances.
3. Wire the sensor (see top of the sketch – use a voltage divider on ECHO for HC-SR04).
4. Upload, open Serial Monitor at 115200 baud.

## Troubleshooting
| Serial Monitor says | Cause |
|---|---|
| `HTTP -1` | ESP32 cannot reach the server: wrong IP, different Wi-Fi network, or firewall blocking port 5000 (Windows: allow Node.js through the firewall) |
| `HTTP 401` | `API_KEY` ≠ `DEVICE_API_KEY` in `server/.env` (restart the server after editing `.env`) |
| `HTTP 400` | missing/invalid field – the response body says which |
| `HTTP 500` "Device key not configured" | `DEVICE_API_KEY` missing from `server/.env` |
| `No echo from sensor` | TRIG/ECHO swapped or loose wire |
| Dashboard pill shows *Offline* | the server isn't running, or you opened the page on a different host than the Vite proxy expects |

For a deployed server use **HTTPS** and switch the sketch to `WiFiClientSecure`.
