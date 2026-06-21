# World Cup Office Challenge — Leaderboard

A dead-simple leaderboard for the office game: pick a team + a top scorer, underdogs
get a handicap, overperform to win. No backend, no install, no internet needed.

## Use it

**Double-click `index.html`** — it opens in your browser and shows the live standings.
That's it. Want to share it? Put the folder on a shared drive, or push to GitHub and
turn on GitHub Pages (free).

## Update standings (the only thing you'll touch: `results.js`)

Open `results.js`, change the numbers, **save, and refresh the page.**

1. **Teams** — for each team set how far it has reached and whether it's out:
   ```js
   "Ghana": { stage: "R16", out: false }   // reached round of 16, still alive
   "Spain": { stage: "GROUP", out: true }  // knocked out in the groups
   ```
   `stage` is the **furthest stage reached** (drives the points):
   `GROUP · R32 · R16 · QF · SF · FINAL · WINNER`.
   `out: true` once a team is eliminated.

2. **Top scorer goals** — fill in goals as they pile up (only matters at the end).
   Add **any** player, not just the picked ones. The app finds the leader and the
   top 3 automatically; ties count for everyone tied.

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

Top scorer: **+10** if your pick is the Golden Boot, **+5** for a top-3 finish.
Winner = highest total; tie broken by closest guess to total tournament goals.

The **Dark horses** panel highlights the high-handicap teams still alive — the
overperformers to watch (the "Ghana is outstanding right now" view).

## Files

| File | What it is |
|---|---|
| `index.html` | The page — UI, styling, scoring logic, fixed rules. No need to edit. |
| `picks.js` | The 23 picks (name + team + scorer). Edit only if a pick changes. |
| `results.js` | **The file you edit** as the tournament progresses. |

> Note: data lives in `.js` files (not `.json`) so the page works by just
> double-clicking it — browsers block reading local `.json` files over `file://`.
