# ProfileTrackHub Development Notes

## Mobile LAN Access

ProfileTrackHub can be opened from another device on the same Wi-Fi network during local development.

### What changed

- Backend listens on `0.0.0.0` so it is reachable from your LAN.
- CRA development server uses `HOST=0.0.0.0`.
- Frontend API and uploaded file URLs support `REACT_APP_API_BASE_URL`.
- Existing local access still works with `http://localhost:5000`.

### Frontend environment

Default frontend development environment:

```env
HOST=0.0.0.0
```

The frontend uses this runtime fallback automatically:

```js
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || window.location.origin;
```

In development, the app also maps `:3000` to `:5000` on the same hostname so CRA still works with laptop and mobile LAN testing.

If you want to force a backend URL explicitly, set:

```env
REACT_APP_API_BASE_URL=http://YOUR_LAPTOP_IP:5000
```

Example:

```env
REACT_APP_API_BASE_URL=http://192.168.1.105:5000
```

### How to run

Backend:

```powershell
cd backend
npm start
```

Frontend dev server:

```powershell
cd backend/frontend
npm start
```

Optional LAN-friendly frontend script:

```powershell
npm run dev:lan
```

### How to open on mobile

1. Connect the laptop and mobile phone to the same Wi-Fi network.
2. Start the backend and frontend development servers.
3. Find the laptop IPv4 address:
   Windows command:

```powershell
ipconfig
```

4. Look for the active Wi-Fi adapter `IPv4 Address`.
5. Open the app in the mobile browser using the laptop IP:

```text
http://YOUR_LAPTOP_IP:5000
```

Example:

```text
http://192.168.1.105:5000
```

### Firewall note

If the mobile browser cannot open the app, allow Node.js or port `5000` through Windows Firewall.

### Final check

After setup, these should work:

- Laptop: `http://localhost:5000`
- Mobile: `http://192.168.x.x:5000`
- Login
- Dashboard
- Public jobs page
- Apply job page
- API requests from mobile
- No CORS issue on the same LAN
