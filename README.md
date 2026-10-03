# Gnanam's Healthy Kitchen (MERN)

`/server` Express + Mongoose API · `/client` React + Vite. Pre-order only, next-day delivery, Vailankanni only.
All times use IST. Admin sets cutoff hour and max orders/day in Admin → Settings.

## Run locally
1. MongoDB Atlas (or local Mongo) URI ready. Cloudinary account for image upload.
2. `cd server && cp .env.example .env` (fill values) `&& npm i && npm run seed && npm run dev`
3. `cd client && cp .env.example .env && npm i && npm run dev` → http://localhost:5173
4. Sign in at `/login` with ADMIN_EMAIL / ADMIN_PASSWORD, then open /admin. Set the real WhatsApp number in Settings first.

## Deploy (free tier)
**1. Atlas:** create free M0 cluster → Database Access: add user → Network Access: allow `0.0.0.0/0` (Render free has no static IP) → Connect → copy the URI as `MONGO_URI` (add `/gnanams-kitchen` before `?`).
**2. Push** this repo to GitHub.
**3. Render:** New → Web Service → repo → Root Directory `server`, Build `npm install`, Start `npm start`. Env vars: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (long random strings), `CLIENT_URL` (Vercel URL, no trailing slash, set after step 4), `CLOUDINARY_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Deploy; check `https://<api>.onrender.com/health`.
**4. Vercel:** Import repo → Root Directory `client` → Framework Vite → env `VITE_API_URL=https://<api>.onrender.com` → Deploy. Copy the URL into Render's `CLIENT_URL`, then redeploy Render.
**5. Seed admin once:** run locally with the production `MONGO_URI` and admin vars: `cd server && npm run seed` (or Render Shell: `npm run seed`).
**6. Test:** open the Vercel URL, sign in at /login, add menu items, place a test order.

Notes
- Cookies use `sameSite:none; secure` + `trust proxy` in production. Some browsers (Safari, Chrome with third-party cookies blocked) may reject cross-domain cookies. For reliability put both on one domain, e.g. `kitchen.yourdomain.com` and `api.yourdomain.com`.
- Render free instances sleep when idle; the first request can take ~30–50 s.
- Customer payment via UPI is shown as a UPI ID/link; payment is not verified automatically.
