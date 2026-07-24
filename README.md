# QR Code Builder

A QR code design tool with Google sign-in — architected the same way as the
reference app it's based on: **Vite + React + Google Identity Services**,
fully client-side, zero backend.

Everything (QR generation, styling, logo embedding, export, and sign-in)
runs in the browser. "Signing in" only decides which local presets belong
to you — no data ever leaves the device.

## Architecture

```
src/
  hooks/useAuth.js            local session (12h TTL), backed by localStorage
  utils/storage.js            namespaced + per-user localStorage helpers
  components/
    GoogleSignInButton.jsx    renders Google's own button via accounts.google.com/gsi/client
    ProtectedRoute.jsx        redirects to /login if not signed in
    Footer.jsx
  pages/
    MainPage.jsx              splash screen, routes to /login or /builder
    LoginPage.jsx             Google sign-in screen
    BuilderPage.jsx           the QR builder tool (protected)
  routes/index.js             public vs protected route table
  App.jsx / main.jsx          router setup, PWA service worker registration
public/
  manifest.webmanifest, icons/, sw.js   installable PWA shell
```

Same shape as the reference project (`useAuth` / `GoogleSignInButton` /
`ProtectedRoute` / `routes/index.js` gating public vs protected pages) —
just re-pointed at a QR builder instead of a duty log, and with
`react-secure-storage` swapped for a simpler plain-localStorage wrapper
since there's no sensitive attendance data to encrypt at rest here.

## Setting up Google Sign-In

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client ID** → Application type: **Web application**.
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local dev)
   - `https://your-app.vercel.app` (after you deploy — you can add this later and redeploy)
4. Copy the generated Client ID.
5. Copy `.env.example` to `.env` and paste it in:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

No client secret, no OAuth redirect/callback server — this uses Google
Identity Services' client-side button, which returns a signed ID token
directly to the browser.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

**Option A — CLI**
```bash
npm i -g vercel
vercel
```

**Option B — GitHub**
1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Vercel auto-detects Vite. Add the `VITE_GOOGLE_CLIENT_ID` environment
   variable in the project's Settings → Environment Variables.
4. Deploy — then go back to Google Cloud Console and add the resulting
   `https://<your-app>.vercel.app` URL to Authorized JavaScript origins.

## Rebranding

- Swap `src/assets/images/logo.png` and the files in `public/icons/` for
  your own mark (sizes: 16, 32, 180, 192, 192-maskable, 512, 512-maskable).
- App name lives in three places: `index.html` `<title>`,
  `public/manifest.webmanifest`, and `package.json`.
