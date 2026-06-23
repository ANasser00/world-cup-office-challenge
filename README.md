# World Cup Office Challenge — Leaderboard

A dead-simple leaderboard for the office game: pick a team + a top scorer, underdogs
get a handicap, overperform to win. No backend, no database, no API key.

## Use it

**Double-click `index.html`** — it opens in your browser and shows the standings.
To share with the office, push to GitHub and turn on **GitHub Pages** (free) — everyone
gets a link, and only people with repo access can change the data.

## Update standings (the only file you touch: `results.js`)

Open `results.js`, edit the values, **save, and refresh the page.** That's the whole loop.

1. **Teams** — for each team set how far it reached and whether it's out:
   ```js
   "Ghana": { stage: "R16", out: false }   // reached round of 16, still alive
   "Spain": { stage: "GROUP", out: true }  // knocked out in the groups
   ```
   `stage` = furthest stage reached (`GROUP · R32 · R16 · QF · SF · FINAL · WINNER`),
   `out: true` once eliminated. You don't enter match scores — just who advanced/out.

2. **Top scorer goals** — leave at 0 until near the end; the bonus only locks then.
   Enter `"Kylian Mbappé": 7` etc. Add any player; the app finds the leader + top 3.

> **Shortcut:** ask Claude to "update the results" and it can look up the latest scores
> and fill in `results.js` for you.

## When the group stage ends

In `results.js`, for each team:
- **Didn't qualify** → set `out: true` (leave `stage: "GROUP"` = 0 pts).
- **Advanced** → set `stage: "R32"`.

Eliminated players move into the **❌ Out of the running** table — their score is now
**locked**, and only the end-of-tournament top-scorer bonus can still change it.

## How the page reads

- **Leaderboard** — everyone ranked. "Still in" / "Eliminated" tags; eliminated players
  keep their points (still in the title race).
- **🐎 Dark horses** — high-handicap teams still alive, the overperformers to watch
  (the "Ghana is outstanding right now" view).
- **⚽ Top scorer race** — top-scorer points only **lock at the end**. Until then it shows
  who's riding on which scorer, and (once you enter goals) a **live projection**
  (🔥 "leading — +10 if it holds") without banking points early. A `+?` on a total means
  a top-scorer bonus is still in play.
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
| `results.js` | **The file you edit** as the tournament progresses. |

> Data lives in `.js` files (not `.json`) so the page works by just double-clicking it —
> browsers block reading local `.json` over `file://`.
