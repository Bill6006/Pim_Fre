# Pimsleur French – lesson tracker

A private, phone-first tracker for your own Pimsleur French audio files. It is a static
site: no server, no login, no build step, and nothing leaves your phone.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS and JavaScript in one file) |
| `manifest.webmanifest` | Name, colors and icons for "Install app" |
| `sw.js` | Offline app shell. It caches only the files above, never your audio |
| `icons/icon.svg` | Original tricolor-headphones app icon |
| `.nojekyll` | Tells GitHub Pages to publish the files exactly as they are |

## Deploy to GitHub Pages

1. Put every file above at the **root** of the repository (e.g. `Pim_Fre`), keeping the
   `icons/` folder. `index.html` must stay lowercase.
2. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, then
   choose `main` and `/ (root)`, and save.
3. After a minute the app is live at `https://<username>.github.io/<repo>/`
   (for example `https://bill6006.github.io/Pim_Fre/`). All paths are relative, so any
   repository name works.

## Install on your phone

1. Open the site in **Chrome** on Android.
2. Chrome menu (⋮) → **Add to Home screen** → **Install**.
3. Open it once while online. After that, the app itself also opens offline.

## Daily use

- **First time:** tap **Connect French folder** and choose your main `French` folder
  (the one that contains `01 Pimsleur French I` … `05 Pimsleur French V` and the bonus
  folders). Android then asks *"Upload 213 files to this site?"* or *"Allow this site to
  view and copy files?"*. That is only Chrome's wording for granting access: the files
  stay on your phone and are played from there.
- **After a restart:** Android forgets the folder permission. Your lessons, checkmarks,
  resume points and total listening time still show. When you tap play, the app asks you
  to **Reconnect audio folder**. Choose the same `French` folder and playback picks up
  where you left off.
- Lessons unlock one at a time. A lesson completes when its audio reaches the end or when
  you tap its circle. Tapping a finished lesson's checkmark marks it not complete, with Undo.

## Your data

- Progress and the lesson list are saved on the phone in two places: IndexedDB, plus a
  localStorage copy that is written instantly. If one copy is damaged, the other restores it.
- **Menu (⋯) → Export progress** saves a small `.json` backup to Downloads.
  **Import progress** restores it, even on a new phone. Audio is never exported.
- Clearing Chrome's site data for `github.io` erases the progress. Export first.
- There is no analytics, tracking, or network traffic beyond loading the app itself.

## Updating the app

Edit the files and push; GitHub Pages redeploys automatically. The service worker always
checks for a newer `index.html` first, so the next launch picks up changes. If you change
the icons or manifest, also bump `VERSION` in `sw.js` (and `APP_VERSION` in `index.html`).

## Troubleshooting

- **An older version of this tracker keeps appearing:** a service worker from a previous
  deployment at the same address may still be installed. Open the site in Chrome, tap the
  icon left of the address → **Site settings → Clear & reset**. This also erases any old
  progress stored there.
- **"No audio files found":** you picked a folder without audio (for example the booklets
  folder). Pick the main `French` folder. Supported types: mp3, m4a, m4b, aac, wav, ogg,
  opus, flac, weba.
- **Picked the wrong folder by mistake:** the app asks before replacing your library, and
  **Menu → Restore previous library** switches back.
- **Testing on a computer:** add `?debug` to the URL to expose `window.pimfr` in DevTools.