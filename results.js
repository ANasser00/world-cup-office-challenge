/* ============================================================
   RESULTS — the ONLY file you edit during the tournament.
   Save it, then refresh the page. Everything recalculates.

   TEAMS — for each team set how far it has reached + whether it's out:
     stage : "GROUP" | "R32" | "R16" | "QF" | "SF" | "FINAL" | "WINNER"
             = the FURTHEST stage reached so far (this drives the points).
     out   : true once the team is eliminated, false while still alive.

   Examples:
     still playing group stage ....... { stage: "GROUP", out: false }
     knocked out in the groups ....... { stage: "GROUP", out: true  }
     reached R16 then lost ........... { stage: "R16",   out: true  }
     lifted the trophy ............... { stage: "WINNER", out: false }

   >>> WHEN THE GROUP STAGE ENDS, do two things per team:
       - team DID NOT qualify  ->  set  out: true   (leave stage "GROUP" = 0 pts)
       - team ADVANCED         ->  set  stage: "R32" (out stays false)
       Eliminated players drop into the "Out of the running" table on the page;
       their score is locked except the top-scorer bonus added at the end.

   Points per stage: GROUP 0 · R32 3 · R16 6 · QF 9 · SF 13 · FINAL 17 · WINNER 22

   TOP SCORER GOALS — goals scored by each player. This only affects points at the
   END of the tournament (Golden Boot +10, top 3 +5). You can leave these at 0 and
   just fill them in once near the end; before that the page shows them as pending.
   Add ANY player, not only the picked ones — the app finds the leader and top 3.

   RECENT MATCHES — shown in the "Latest matches" card. Newest by date appears first.
   Each: { date:"YYYY-MM-DD", team1, s1, s2, team2, stage }. Add as games finish.

   TOTAL GOALS — optional. The real total goals in the tournament, used only for the
   tie-break ("closest guess wins"). Leave null until known.

   Tip: ask Claude to "update the results" and it can look up the latest scores and
   fill this file in for you.
   ============================================================ */
window.RESULTS = {

  totalGoalsActual: null,

  teams: {
    "New Zealand":  { stage: "GROUP", out: true },
    "Spain":        { stage: "R32", out: false },
    "Belgium":      { stage: "R32", out: false },
    "Egypt":        { stage: "R32", out: false },
    "France":       { stage: "R32", out: false },
    "Algeria":      { stage: "R32", out: false },
    "Qatar":        { stage: "GROUP", out: true },
    "Portugal":     { stage: "R32", out: false },
    "Morocco":      { stage: "R32", out: false },
    "England":      { stage: "R32", out: false },
    "Iran":         { stage: "GROUP", out: true },
    "Netherlands":  { stage: "R32", out: false },
    "Brazil":       { stage: "R32", out: false },
    "Australia":    { stage: "R32", out: false },
    "Saudi Arabia": { stage: "GROUP", out: true },
    "Croatia":      { stage: "R32", out: false },
    "Sweden":       { stage: "R32", out: false },
    "Argentina":    { stage: "R32", out: false },
    "Scotland":     { stage: "GROUP", out: true },
    "Uruguay":      { stage: "GROUP", out: true },
    "Germany":      { stage: "R32", out: false },
    "Senegal":      { stage: "R32", out: false },
    "Austria":      { stage: "R32", out: false },
  },
  // Goals so far — as of ~2026-06-29 (sources: NBC / Goal.com). Refresh anytime
  // (ask Claude to "update the results"). Add ANY scorer, not just picked ones.
  topScorerGoals: {
    "Lionel Messi":      6,
    "Kylian Mbappé":     4,
    "Erling Haaland":    4,
    "Vinícius Júnior":   4,
    "Ousmane Dembélé":   4,
    "Deniz Undav":       3,
    "Jonathan David":    3,
    "Harry Kane":        3,
    "Matheus Cunha":     3,
    "Folarin Balogun":   2,
    "Kai Havertz":       2,
    "Mikel Oyarzabal":   2,
    "Cody Gakpo":        2,
    "Cristiano Ronaldo": 2,
    "Alexander Isak":    1,
    "Michael Olise":     0,
    "Julián Álvarez":    0,
  },

  // Most recent results (newest first). { date, team1, s1, s2, team2, stage }
  recentMatches: [
    { date: "2026-06-28", team1: "South Africa", s1: 0, s2: 1, team2: "Canada",      stage: "Round of 32" },
    { date: "2026-06-27", team1: "Argentina",  s1: 3, s2: 1, team2: "Jordan",        stage: "Group" },
    { date: "2026-06-27", team1: "Austria",    s1: 3, s2: 3, team2: "Algeria",       stage: "Group" },
    { date: "2026-06-27", team1: "Colombia",   s1: 0, s2: 0, team2: "Portugal",      stage: "Group" },
    { date: "2026-06-27", team1: "DR Congo",   s1: 3, s2: 1, team2: "Uzbekistan",    stage: "Group" },
    { date: "2026-06-27", team1: "England",    s1: 2, s2: 0, team2: "Panama",        stage: "Group" },
    { date: "2026-06-27", team1: "Croatia",    s1: 2, s2: 1, team2: "Ghana",         stage: "Group" },
    { date: "2026-06-26", team1: "Norway",     s1: 4, s2: 1, team2: "France",        stage: "Group" },
    { date: "2026-06-26", team1: "Belgium",    s1: 5, s2: 1, team2: "New Zealand",   stage: "Group" },
    { date: "2026-06-26", team1: "Spain",      s1: 1, s2: 0, team2: "Uruguay",       stage: "Group" },
    { date: "2026-06-26", team1: "Egypt",      s1: 1, s2: 1, team2: "Iran",          stage: "Group" },
    { date: "2026-06-26", team1: "Cabo Verde", s1: 0, s2: 0, team2: "Saudi Arabia",  stage: "Group" },
    { date: "2026-06-26", team1: "Senegal",    s1: 5, s2: 0, team2: "Iraq",          stage: "Group" },
    { date: "2026-06-25", team1: "Türkiye",     s1: 3, s2: 2, team2: "United States",       stage: "Group" },
    { date: "2026-06-25", team1: "Paraguay",    s1: 0, s2: 0, team2: "Australia",            stage: "Group" },
    { date: "2026-06-25", team1: "Curaçao",     s1: 0, s2: 2, team2: "Cote d’Ivoire",        stage: "Group" },
    { date: "2026-06-25", team1: "Ecuador",     s1: 2, s2: 1, team2: "Germany",              stage: "Group" },
    { date: "2026-06-25", team1: "Japan",       s1: 1, s2: 1, team2: "Sweden",               stage: "Group" },
    { date: "2026-06-25", team1: "Netherlands", s1: 3, s2: 1, team2: "Tunisia",              stage: "Group" },
    { date: "2026-06-24", team1: "Mexico",      s1: 3, s2: 0, team2: "Czechia",              stage: "Group" },
    { date: "2026-06-24", team1: "South Africa",s1: 1, s2: 0, team2: "South Korea",          stage: "Group" },
    { date: "2026-06-24", team1: "Switzerland", s1: 3, s2: 1, team2: "Canada",               stage: "Group" },
    { date: "2026-06-24", team1: "Bosnia & Herzegovina", s1: 3, s2: 1, team2: "Qatar",       stage: "Group" },
    { date: "2026-06-24", team1: "Scotland",    s1: 0, s2: 3, team2: "Brazil",               stage: "Group" },
    { date: "2026-06-24", team1: "Morocco",     s1: 4, s2: 2, team2: "Haiti",                stage: "Group" },
    { date: "2026-06-23", team1: "Portugal",  s1: 5, s2: 0, team2: "Uzbekistan", stage: "Group" },
    { date: "2026-06-23", team1: "Colombia",  s1: 1, s2: 0, team2: "DR Congo",   stage: "Group" },
    { date: "2026-06-23", team1: "England",   s1: 0, s2: 0, team2: "Ghana",      stage: "Group" },
    { date: "2026-06-23", team1: "Panama",    s1: 0, s2: 1, team2: "Croatia",    stage: "Group" },
    { date: "2026-06-23", team1: "Jordan",    s1: 1, s2: 2, team2: "Algeria",    stage: "Group" },
    { date: "2026-06-22", team1: "Argentina", s1: 2, s2: 0, team2: "Austria",    stage: "Group" },
    { date: "2026-06-22", team1: "France",    s1: 3, s2: 0, team2: "Iraq",       stage: "Group" },
    { date: "2026-06-22", team1: "Norway",    s1: 3, s2: 2, team2: "Senegal",    stage: "Group" },
    { date: "2026-06-17", team1: "England",   s1: 4, s2: 2, team2: "Croatia",    stage: "Group" },
    { date: "2026-06-17", team1: "Ghana",     s1: 1, s2: 0, team2: "Panama",     stage: "Group" },
    { date: "2026-06-17", team1: "Portugal",  s1: 1, s2: 1, team2: "DR Congo",   stage: "Group" },
    { date: "2026-06-17", team1: "Colombia",  s1: 3, s2: 1, team2: "Uzbekistan", stage: "Group" },
  ],

};
