# World Cup Office Challenge — Leaderboard

A dead-simple leaderboard for the office game: pick a team + a top scorer, underdogs
get a handicap, overperform to win. No backend, no database, no API key.

## Use it

**Double-click `index.html`** — it opens in your browser and shows the standings.
To share with the office, push to GitHub and turn on **GitHub Pages** (free) — everyone
gets a link, and only people with repo access can change the data.

## Standings update automatically 🎉

The results (which teams advanced, who's out, goal scorers) are pulled from a free public
dataset — [openfootball](https://github.com/openfootball/worldcup.json) — so **you don't
have to keep score by hand.** There are three ways it refreshes, all running the same
script (`scripts/update-results.js`), which rewrites `results.js`:

| How | What to do | Good for |
|---|---|---|
| **Scheduled** | Nothing — the GitHub Action runs daily (midday Gulf time). | Set-and-forget |
| **On demand** | Repo → **Actions** tab → *Update results* → **Run workflow**. | "Refresh now" |
| **Locally** | `node scripts/update-results.js` (Node 18+, no install). | No GitHub / testing |

Because everyone reads the same published `results.js`, there's effectively **one updater**
(the schedule, or whoever has repo access) — a random viewer can't change the standings.

> openfootball is community-maintained and refreshes roughly once a day, so this is
> "updated daily," not second-by-second live. Perfect for a game that runs over weeks.

### To enable the schedule (one-time)
1. Push this folder to a GitHub repo.
2. Settings → **Pages** → deploy from `main` branch (gets you the shareable link).
3. Settings → **Actions** → **General** → allow workflows to read/write. That's it —
   the daily job will keep `results.js` (and the live page) up to date.
   Change the time in `.github/workflows/update-results.yml` (one cron line, in UTC).

## Prefer to keep score manually?

You can. Just edit `results.js` by hand and refresh — but note the scheduled job will
overwrite it on its next run (pause the schedule if you want full manual control).

- **Teams** — `"Ghana": { stage: "R16", out: false }`.
  `stage` = furthest reached (`GROUP · R32 · R16 · QF · SF · FINAL · WINNER`),
  `out: true` once eliminated.
- **Top scorer goals** — `"Kylian Mbappé": 7`. Add any player; the app finds the
  leader and top 3, ties included.

## How the page reads

- **Leaderboard** — everyone ranked. "Still in" / "Eliminated" tags; eliminated players
  keep their points (still in the title race).
- **🐎 Dark horses** — high-handicap teams still alive, the overperformers to watch
  (the "Ghana is outstanding right now" view).
- **⚽ Top scorer race** — top-scorer points only **lock at the end** of the tournament.
  Until then it shows a **live projection** (🔥 "leading — +10 if it holds") so you can
  see who *would* gain, without banking the points early. A `+?` on a total means a
  top-scorer bonus is still in play.
- **❌ Out of the running** — eliminated players with their locked score.

## Scoring (from the challenge deck)

`total = stage points + handicap bonus + top-scorer points`

| Stage | Pts |  | Bucket | Handicap |
|---|---|---|---|---|
| Group exit | 0 | | Favourites | +0 |
| Round of 32 | 3 | | Strong | +3 |
| Round of 16 | 6 | | Outsiders | +6 |
| Quarter-final | 9 | | Underdogs | +10 |
| Semi-final | 13 | | Long shots | +14 |
| Final | 17 | | | |
| Winner | 22 | | | |

Top scorer: **+10** for the Golden Boot, **+5** for a top-3 finish (locked at the end).
Winner = highest total; tie broken by closest guess to total tournament goals.

## Files

| File | What it is |
|---|---|
| `index.html` | The page — UI, styling, scoring logic. No need to edit. |
| `picks.js` | The 23 picks (name + team + scorer). Edit only if a pick changes. |
| `results.js` | Standings data — **auto-generated** (or hand-edit as fallback). |
| `scripts/update-results.js` | Fetches live data and rewrites `results.js`. |
| `.github/workflows/update-results.yml` | Runs the script on a schedule / on demand. |

> Data lives in `.js` files (not `.json`) so the page works by just double-clicking it —
> browsers block reading local `.json` over `file://`.
