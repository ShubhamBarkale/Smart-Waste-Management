# What changed

## Alerts & thresholds (50 / 60 / 90)
- `server/config/thresholds.js` is now the one place for fill levels (client copy: `client/src/config/thresholds.js`).
- Status: **Normal** < 50 · **Warning** 50–89 · **Critical** ≥ 90 (was 80).
- Alerts fire once when a bin crosses UP through **50 (Half full)**, **60 (Warning)**, **90 (Bin full)**.
  A 3-point hysteresis stops a noisy sensor from re-alerting at 59↔60.
- At 90 % a collection task is still created automatically (once per bin).
- New `Bin.alertLevel` field remembers the last level raised; reset to 0 when a task is completed.

## Live dashboard
- Socket.IO (`server/services/realtime.js`). Browsers authenticate with their JWT.
- Every ESP32 reading pushes `bin:update`; Dashboard, Map, Alerts, Tasks, Analytics, Command Center and the
  employee pages refresh silently (no spinner, no manual reload).
- Threshold alerts go to all admins + employees of the bin's zone (KOP- → kopargaon, SHR- → shirdi) as toasts with a sound
  (1/2/3 beeps by level), optional desktop notification for "Bin full". Header pill shows Live/Offline and a mute button.
- FillBar colours: green < 50, yellow 50–59, orange 60–89, red ≥ 90, with tick marks at 50/60/90.

## Security fixes
- `/api/bins/update` (ESP32) now needs header `x-api-key` = `DEVICE_API_KEY`.
- Employees' Bin Scanner uses new JWT-protected `POST /api/bins/manual-update` (own zone only, existing bins only).
- `/api/auth/register` no longer lets anyone choose `role: admin` (first account in an empty DB = admin; later admins only by an admin).
- Employees can only change status of tasks assigned to them.
- Deactivated users are rejected on every request and on the socket.
- Input validation on sensor data (numbers, range, bin id format); internal error text no longer sent to clients.
- Login response now includes `_id` and `zone` (employee pages need them right after login).

## New
- `Reading` collection (sensor history, auto-deleted after 90 days) and `GET /api/bins/:binId/history?hours=24`.
- `firmware/esp32_smart_bin/esp32_smart_bin.ino` and `docs/ESP32_SETUP.md`.

## Upgrade steps
1. `cd server && npm install` · `cd ../client && npm install` (new deps: socket.io, socket.io-client)
2. Add `DEVICE_API_KEY` to `server/.env` (see `.env.example`).
3. Existing bins in MongoDB are fine; `alertLevel` is filled in at their next update (or re-run `node seed.js` for demo data).
