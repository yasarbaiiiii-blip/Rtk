# One-Link Distribution Setup

Use `public/download.html` as your single landing page.

## 1. Fill in your real links
Edit `public/download.html` and replace:

1. `LINKS.android` with your Google Play Internal App Sharing link
2. `LINKS.ios` with your TestFlight public link
3. `LINKS.web` with your deployed web app URL

## 2. Build and sync

```bash
npm run build
npx cap sync
```

## 3. Deploy landing page
Deploy the web project (or at least `download.html`) to your domain:

1. `https://yourapp.link/download.html`
2. Optional: map `https://yourapp.link` to redirect to `/download.html`

## 4. Result
Users open one URL and choose:

1. Android Install
2. iOS Install
3. Web App

The page auto-highlights the recommended button based on device type.
