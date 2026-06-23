#!/usr/bin/env node
/* ============================================================
   update-results.js — regenerate results.js from live data.

   Pulls openfootball's public 2026 World Cup dataset (no key, no signup),
   works out how far each picked team has gone + who's out, tallies every
   goal scorer, and rewrites results.js.

   Run it three ways — all do the same thing:
     • Scheduled  : the GitHub Action runs it every day (see .github/workflows)
     • On demand  : "Run workflow" button in the repo's Actions tab
     • Locally    : `node scripts/update-results.js`

   Needs Node 18+ (uses built-in fetch). No npm install required.
   ============================================================ */

const fs = require("fs");
const path = require("path");

const SOURCES = [
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
  "https://raw.githubusercontent.com/openfootball/worldcup.json/main/2026/worldcup.json",
];

/* The 48 tournament teams (canonical spellings, matching index.html buckets). */
const KNOWN_TEAMS = [
  "France","Argentina","Spain","England","Portugal","Germany","Brazil","Netherlands",
  "Norway","Morocco","Croatia","Japan","Colombia","Switzerland","Belgium","Uruguay","Ecuador","Mexico",
  "Austria","Türkiye","United States","Senegal","Paraguay","Canada","Egypt","South Korea","Sweden","Australia",
  "Bosnia & Herzegovina","Czechia","Cote d’Ivoire","Algeria","Scotland","Tunisia","Iran","South Africa","Ghana","Panama",
  "Uzbekistan","Qatar","Jordan","Saudi Arabia","Iraq","DR Congo","Cabo Verde","Curaçao","Haiti","New Zealand",
];

/* openfootball may spell some names differently — map them back to ours. */
const ALIASES = {
  "usa":"United States","united states of america":"United States",
  "korea republic":"South Korea","south korea":"South Korea","korea":"South Korea",
  "iran":"Iran","ir iran":"Iran",
  "turkey":"Türkiye","turkiye":"Türkiye",
  "ivory coast":"Cote d’Ivoire","cote divoire":"Cote d’Ivoire","cote d ivoire":"Cote d’Ivoire",
  "cape verde":"Cabo Verde","cabo verde":"Cabo Verde",
  "curacao":"Curaçao",
  "congo dr":"DR Congo","dr congo":"DR Congo","democratic republic of the congo":"DR Congo",
  "bosnia and herzegovina":"Bosnia & Herzegovina","bosnia herzegovina":"Bosnia & Herzegovina",
  "czech republic":"Czechia","czechia":"Czechia",
};

/* normalize for matching: lowercase, strip accents + punctuation */
function norm(s){
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g,"")
    .toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
}
const LOOKUP = {};
KNOWN_TEAMS.forEach(t => { LOOKUP[norm(t)] = t; });
Object.entries(ALIASES).forEach(([k,v]) => { LOOKUP[norm(k)] = v; });

/* a slot is a real qualified team only if we recognise it; otherwise it's a
   knockout placeholder code like "2A" or "W74". */
function realTeam(name){ return LOOKUP[norm(name)] || null; }

const ROUND_RANK = {
  "round of 32":1, "round of 16":2,
  "quarter final":3, "quarter finals":3, "quarterfinal":3, "quarterfinals":3,
  "semi final":4, "semi finals":4, "semifinal":4, "semifinals":4,
  "final":5,
};
const RANK_STAGE = {0:"GROUP",1:"R32",2:"R16",3:"QF",4:"SF",5:"FINAL",6:"WINNER"};

function rankOf(round){
  const r = norm(round);
  if (r.startsWith("matchday") || r.startsWith("group")) return 0;   // group stage
  if (r.includes("third place")) return null;                        // ignore 3rd-place playoff
  return ROUND_RANK[r] ?? null;
}

async function fetchData(){
  let lastErr;
  for (const url of SOURCES){
    try {
      const res = await fetch(url, { headers:{ "user-agent":"wc-office-challenge" }});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch(e){ lastErr = e; }
  }
  throw new Error(`Could not fetch source data: ${lastErr && lastErr.message}`);
}

function compute(data){
  const matches = Array.isArray(data.matches) ? data.matches : [];
  const reached = {};            // team -> max rank reached (by real name)
  const populated = new Set([0]); // ranks where a real team appears
  const goals = {};              // player -> goal count
  let totalGoals = 0;
  let finalWinner = null;

  for (const m of matches){
    const rank = rankOf(m.round);
    const t1 = realTeam(m.team1), t2 = realTeam(m.team2);

    if (rank !== null){
      [t1,t2].forEach(t => { if (t){ reached[t] = Math.max(reached[t] ?? 0, rank); populated.add(rank); }});
    }

    // tally goals (skip own goals)
    const ft = m.score && Array.isArray(m.score.ft) ? m.score.ft : null;
    for (const side of ["goals1","goals2"]){
      if (Array.isArray(m[side])) for (const g of m[side]){
        if (g && g.name && !g.owngoal){ goals[g.name] = (goals[g.name]||0)+1; }
      }
    }
    if (ft && ft.length===2 && Number.isFinite(ft[0]) && Number.isFinite(ft[1])) totalGoals += ft[0]+ft[1];

    // champion: the team that won the played Final
    if (rank===5 && t1 && t2 && ft && ft[0]!==ft[1]){
      finalWinner = ft[0] > ft[1] ? t1 : t2;
    }
  }

  const deepest = Math.max(...populated);   // frontier of the tournament so far
  const teams = {};
  for (const t of KNOWN_TEAMS){
    if (!(t in reached)) continue;          // team not in the dataset yet — leave to default
    let rank = reached[t];
    let out = rank < deepest;               // didn't make the next, already-populated round
    if (finalWinner === t){ rank = 6; out = false; }   // champion
    teams[t] = { stage: RANK_STAGE[rank], out };
  }

  // top scorers: keep everyone with >=1 goal so ties at the top are correct
  const topScorerGoals = {};
  Object.entries(goals).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]))
    .forEach(([n,g]) => { topScorerGoals[n] = g; });

  return { teams, topScorerGoals, totalGoals, deepest };
}

function render(result){
  const stamp = new Date().toISOString();
  const teamLines = Object.entries(result.teams)
    .map(([t,r]) => `    ${JSON.stringify(t)}: { stage: ${JSON.stringify(r.stage)}, out: ${r.out} },`).join("\n");
  const scorerLines = Object.entries(result.topScorerGoals)
    .map(([n,g]) => `    ${JSON.stringify(n)}: ${g},`).join("\n") || "    // no goals recorded yet";
  return `/* ============================================================
   RESULTS — AUTO-GENERATED by scripts/update-results.js
   Last updated: ${stamp}
   Source: openfootball/worldcup.json (public, no key)

   You normally don't touch this file — the scheduled job rewrites it.
   Hand-edits work too, but the next scheduled run will overwrite them.
   Stage points: GROUP 0 · R32 3 · R16 6 · QF 9 · SF 13 · FINAL 17 · WINNER 22
   ============================================================ */
window.RESULTS = {

  updatedAt: ${JSON.stringify(stamp)},
  source: "openfootball/worldcup.json",
  totalGoalsActual: ${result.totalGoals || 0},

  teams: {
${teamLines || "    // no teams in dataset yet"}
  },

  topScorerGoals: {
${scorerLines}
  },

};
`;
}

(async function main(){
  try {
    const data = await fetchData();
    const result = compute(data);
    const out = render(result);
    fs.writeFileSync(path.join(__dirname, "..", "results.js"), out);
    const live = Object.values(result.teams).filter(r=>!r.out).length;
    console.log(`✓ results.js updated — ${Object.keys(result.teams).length} teams (${live} still in), ` +
      `${Object.keys(result.topScorerGoals).length} scorers, ${result.totalGoals} goals so far. ` +
      `Frontier: ${RANK_STAGE[result.deepest]}.`);
  } catch(e){
    console.error("✗ Update failed:", e.message);
    console.error("  results.js was left unchanged (manual data still works).");
    process.exit(1);
  }
})();
