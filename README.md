# Home Chores

Shared chore tracker for Vanessa and Katalina. Mobile-first PWA on Node + SQLite (libSQL). No login; each phone remembers who it belongs to.

## Run it

Docker (recommended on the mini PC):

```bash
docker compose up -d --build
```

Then open `http://<mini-pc-ip>:3000` on each phone and Add to Home Screen. Edit `TZ` in `docker-compose.yml` first so "today" rolls over at local midnight. The database is `./data/chores.db`, so back that folder up.

Without Docker (Node 22.13+):

```bash
npm install
node server.js
```

## Features

- **Today**: due and overdue chores grouped by owner, big tap-to-complete, Mine / Everyone toggle, undo, "Vanessa did Katalina's chore" logging. Checklist chores complete when every step is ticked.
- **Recurring**: daily, weekly, biweekly, monthly, quarterly, 6-month, preferred weekday, morning/night. Overdue stays until done. The next due date is computed from the completion and snapped to the preferred weekday.
- **Balance**: weekly/monthly minutes per person, dashed planned lines, planned split by owner. Automated chores are excluded.
- **Projects**: To do / In progress / Done, owners, notes, sub-tasks.
- **History**: filter by person and chore, daily streaks.
- **Settings**: add/edit/archive chores, swap owner, optional "rotate owner on completion".
- **Tags**: `/c/<slug>` opens a "Mark done?" page. Settings → Open tag sheet lists every URL with a QR code, a copy button and a print layout. Write the URL to an NFC tag as a plain URL record.
- **Reminders**: see below.

## Reminders

The spec was cut off at item 9, so this is my guess at what you meant: push reminders to each phone twice a day (a morning list and an evening check), only when something is due. It uses [ntfy](https://ntfy.sh). Install the ntfy app on each phone, subscribe to a private topic per person, then enter the topics under Settings → Reminders. Use `ntfy.sh` or your own server (`NTFY_BASE`). The app badge on the Today tab also shows how many chores are yours today.

## Notes

- Set **This app's address** in Settings (for example `http://chores.local:3000`) so printed QR codes use the address your phones can reach.
- NFC and the clipboard "Copy link" button work on plain http. Installing as a PWA and service workers need HTTPS or `localhost` on some phones; the app still works in the browser without that.
- API is plain JSON under `/api`.

## Free hosting on Vercel + Turso (public HTTPS link with a passcode)

Vercel runs the app and Turso (a free hosted SQLite database) stores the data. Both have free plans. Everything is in the app's own repo, separate from your portfolio.

1. **Put this folder in its own GitHub repo** (for example `home-chores`). `data/` and `node_modules/` are already git-ignored.
2. **Turso**: sign up at turso.tech, then create a database. Pick the AWS US East region to sit next to Vercel's default. Copy the database URL (`libsql://...`) and create an auth token.
3. **Move your chores over** (optional; run once, from this folder, with the local app stopped):
   ```bash
   TURSO_DATABASE_URL=libsql://your-db.turso.io TURSO_AUTH_TOKEN=... node scripts/migrate-to-turso.mjs
   ```
   It refuses to run against a database that already has chores.
4. **Vercel**: Add New → Project → import the new repo (not the portfolio). Leave the framework as "Other". Under Environment Variables add:

   | Name | Value |
   | --- | --- |
   | `TURSO_DATABASE_URL` | your `libsql://...` URL |
   | `TURSO_AUTH_TOKEN` | your token |
   | `PASSCODE` | the passcode you both will use |
   | `APP_TZ` | your timezone, for example `America/New_York` |
   | `CRON_SECRET` | any long random string (enables reminders) |

   Then Deploy. Open the `.vercel.app` link, enter the passcode, pick who you are, and Add to Home Screen.

**Reminders on Vercel's free plan.** Vercel's free plan runs scheduled jobs once a day, at a rough time. `vercel.json` schedules the morning one at 13:00 UTC and the evening one at 00:00 UTC (8am and 7pm US Eastern in winter; one hour later in summer). The times in Settings only apply when running with Docker or `node server.js`.
