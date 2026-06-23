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

   TOTAL GOALS — optional. The real total goals in the tournament, used only for the
   tie-break ("closest guess wins"). Leave null until known.

   Tip: ask Claude to "update the results" and it can look up the latest scores and
   fill this file in for you.
   ============================================================ */
window.RESULTS = {

  totalGoalsActual: null,

  teams: {
    "New Zealand":  { stage: "GROUP", out: false },
    "Spain":        { stage: "GROUP", out: false },
    "Belgium":      { stage: "GROUP", out: false },
    "Egypt":        { stage: "GROUP", out: false },
    "France":       { stage: "GROUP", out: false },
    "Algeria":      { stage: "GROUP", out: false },
    "Qatar":        { stage: "GROUP", out: false },
    "Portugal":     { stage: "GROUP", out: false },
    "Morocco":      { stage: "GROUP", out: false },
    "England":      { stage: "GROUP", out: false },
    "Iran":         { stage: "GROUP", out: false },
    "Netherlands":  { stage: "GROUP", out: false },
    "Brazil":       { stage: "GROUP", out: false },
    "Australia":    { stage: "GROUP", out: false },
    "Saudi Arabia": { stage: "GROUP", out: false },
    "Croatia":      { stage: "GROUP", out: false },
    "Sweden":       { stage: "GROUP", out: false },
    "Argentina":    { stage: "GROUP", out: false },
    "Scotland":     { stage: "GROUP", out: false },
    "Uruguay":      { stage: "GROUP", out: false },
    "Germany":      { stage: "GROUP", out: false },
    "Senegal":      { stage: "GROUP", out: false },
    "Austria":      { stage: "GROUP", out: false },
  },

  topScorerGoals: {
    "Kylian Mbappé":   0,
    "Lionel Messi":    0,
    "Harry Kane":      0,
    "Michael Olise":   0,
    "Vinícius Júnior": 0,
    "Ousmane Dembélé": 0,
    "Erling Haaland":  0,
    "Julián Álvarez":  0,
    "Alexander Isak":  0,
  },

};
