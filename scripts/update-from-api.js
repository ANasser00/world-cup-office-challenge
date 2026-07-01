#!/usr/bin/env node
/* ============================================================
   update-from-api.js — regenerate results.js from football-data.org.

   Free tier, no npm deps (Node 20+ built-in fetch). Token from env FD_TOKEN.
   Runs in the GitHub Action hourly, or locally:  FD_TOKEN=xxx node scripts/update-from-api.js

   Pulls matches + scorers, derives each team's stage/elimination, the latest
   results, the upcoming fixtures, and the goal chart, then rewrites results.js.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.FD_TOKEN;
if (!TOKEN) { console.error('✗ FD_TOKEN env var not set'); process.exit(1); }
const BASE = 'https://api.football-data.org/v4/competitions/WC';

/* ---- name maps ---- */
const TEAM_ALIASES = {
  'Cape Verde Islands': 'Cabo Verde',
  'Congo DR': 'DR Congo',
  'Ivory Coast': 'Cote d’Ivoire',
  'Turkey': 'Türkiye',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
};
function team(name){ return name ? (TEAM_ALIASES[name] || name) : null; }

/* our 23 picks (team spellings must match buckets; scorer spellings canonical) */
const PICK_SCORERS = ['Kylian Mbappé','Lionel Messi','Harry Kane','Michael Olise',
  'Vinícius Júnior','Ousmane Dembélé','Erling Haaland','Julián Álvarez','Alexander Isak'];

function norm(s){
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase().replace(/[^a-z0-9]/g,'');
}
const PICK_SCORER_BY_NORM = {};
PICK_SCORERS.forEach(n => { PICK_SCORER_BY_NORM[norm(n)] = n; });
function scorerName(apiName){ return PICK_SCORER_BY_NORM[norm(apiName)] || apiName; }

/* ---- stage maps ---- */
const STAGE_RANK = { GROUP_STAGE:0, LAST_32:1, LAST_16:2, QUARTER_FINALS:3, SEMI_FINALS:4, FINAL:5 };
const RANK_CODE  = { 0:'GROUP', 1:'R32', 2:'R16', 3:'QF', 4:'SF', 5:'FINAL', 6:'WINNER' };
const STAGE_LABEL = { GROUP_STAGE:'Group', LAST_32:'Round of 32', LAST_16:'Round of 16',
  QUARTER_FINALS:'Quarter-final', SEMI_FINALS:'Semi-final', FINAL:'Final' };

async function get(url){
  const res = await fetch(url, { headers: { 'X-Auth-Token': TOKEN } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}: ${await res.text()}`);
  return res.json();
}

function winnerTeam(m){
  if (m.score.winner === 'HOME_TEAM') return team(m.homeTeam.name);
  if (m.score.winner === 'AWAY_TEAM') return team(m.awayTeam.name);
  return null; // DRAW (group) — no single winner
}

function computeTeams(matches){
  // gather per-team appearances (rank + match), ignoring THIRD_PLACE
  const seen = {};        // teamName -> {maxRank, matchAtMax}
  let anyKnockout = false;
  for (const m of matches){
    if (m.stage === 'THIRD_PLACE') continue;
    const rank = STAGE_RANK[m.stage];
    if (rank === undefined) continue;
    if (rank >= 1) anyKnockout = true;
    for (const t of [team(m.homeTeam.name), team(m.awayTeam.name)]){
      if (!t) continue;
      if (!seen[t] || rank > seen[t].maxRank || (rank === seen[t].maxRank && m.status === 'FINISHED')){
        // prefer the finished match at the deepest rank
        if (!seen[t] || rank > seen[t].maxRank) seen[t] = { maxRank: rank, match: m };
        else if (rank === seen[t].maxRank && m.status === 'FINISHED') seen[t] = { maxRank: rank, match: m };
      }
    }
  }
  const teams = {};
  for (const [t, info] of Object.entries(seen)){
    const { maxRank, match } = info;
    if (match.status === 'FINISHED'){
      if (maxRank === 0){
        // group-only: eliminated once knockouts exist, else still playing
        teams[t] = { stage: 'GROUP', out: anyKnockout };
      } else {
        const won = winnerTeam(match) === t;
        if (won){
          const next = maxRank + 1;          // advanced to next round
          teams[t] = { stage: RANK_CODE[next] || 'WINNER', out: false };
        } else {
          teams[t] = { stage: RANK_CODE[maxRank], out: true };  // lost here
        }
      }
    } else {
      // upcoming/playing at this round → reached it, alive
      teams[t] = { stage: RANK_CODE[maxRank], out: false };
    }
  }
  return teams;
}

function scoreOf(m){
  // returns {s1,s2,note} — regular score for shootouts + pens note
  const ft = m.score.fullTime, rt = m.score.regularTime;
  if (m.score.duration === 'PENALTY_SHOOTOUT' && rt && m.score.penalties){
    const p = m.score.penalties;
    const w = winnerTeam(m);
    const hi = Math.max(p.home, p.away), lo = Math.min(p.home, p.away);
    return { s1: rt.home, s2: rt.away, note: `${w} won ${hi}-${lo} on pens` };
  }
  return { s1: ft.home, s2: ft.away, note: null };
}

function build(matches, scorers){
  const finished = matches.filter(m => m.status === 'FINISHED');

  // recent matches (latest ~12 by date desc)
  const recent = finished.slice()
    .sort((a,b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 12)
    .map(m => {
      const sc = scoreOf(m);
      const r = { date: m.utcDate.slice(0,10), team1: team(m.homeTeam.name),
        s1: sc.s1, s2: sc.s2, team2: team(m.awayTeam.name),
        stage: STAGE_LABEL[m.stage] || m.stage };
      if (sc.note) r.note = sc.note;
      return r;
    });

  // fixtures (next ~10 not-finished with real teams, by date asc)
  const fixtures = matches
    .filter(m => m.status !== 'FINISHED' && m.homeTeam.name && m.awayTeam.name)
    .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate))
    .slice(0, 10)
    .map(m => ({ utc: m.utcDate, team1: team(m.homeTeam.name), team2: team(m.awayTeam.name),
      stage: STAGE_LABEL[m.stage] || m.stage }));

  // scorers → canonical names; ensure all picked scorers present (0 if absent)
  const goals = {};
  for (const s of scorers) goals[scorerName(s.player.name)] = s.goals;
  for (const p of PICK_SCORERS) if (!(p in goals)) goals[p] = 0;
  const topScorerGoals = {};
  Object.entries(goals).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]))
    .forEach(([n,g]) => { topScorerGoals[n] = g; });

  // total goals in finished matches
  let totalGoals = 0;
  for (const m of finished){
    const ft = m.score.regularTime && m.score.duration === 'PENALTY_SHOOTOUT'
      ? m.score.regularTime : m.score.fullTime;
    if (ft && Number.isFinite(ft.home) && Number.isFinite(ft.away)) totalGoals += ft.home + ft.away;
  }

  return { teams: computeTeams(matches), topScorerGoals, recentMatches: recent, fixtures, totalGoals };
}

function render(d, stamp){
  const teamLines = Object.entries(d.teams)
    .map(([t,r]) => `    ${JSON.stringify(t)}: { stage: ${JSON.stringify(r.stage)}, out: ${r.out} },`).join('\n');
  const scorerLines = Object.entries(d.topScorerGoals)
    .map(([n,g]) => `    ${JSON.stringify(n)}: ${g},`).join('\n');
  const matchLines = d.recentMatches.map(m =>
    `    { date: ${JSON.stringify(m.date)}, team1: ${JSON.stringify(m.team1)}, s1: ${m.s1}, s2: ${m.s2}, team2: ${JSON.stringify(m.team2)}, stage: ${JSON.stringify(m.stage)}${m.note?`, note: ${JSON.stringify(m.note)}`:''} },`).join('\n');
  const fixtureLines = d.fixtures.map(f =>
    `    { utc: ${JSON.stringify(f.utc)}, team1: ${JSON.stringify(f.team1)}, team2: ${JSON.stringify(f.team2)}, stage: ${JSON.stringify(f.stage)} },`).join('\n');
  return `/* ============================================================
   RESULTS — AUTO-GENERATED by scripts/update-from-api.js
   Last updated: ${stamp}
   Source: football-data.org (FIFA World Cup, free tier)
   Do not hand-edit — the scheduled job overwrites this hourly.
   Stage points: GROUP 0 · R32 3 · R16 6 · QF 9 · SF 13 · FINAL 17 · WINNER 22
   ============================================================ */
window.RESULTS = {

  updatedAt: ${JSON.stringify(stamp)},
  source: "football-data.org",
  totalGoalsActual: ${d.totalGoals},

  teams: {
${teamLines}
  },

  topScorerGoals: {
${scorerLines}
  },

  recentMatches: [
${matchLines}
  ],

  fixtures: [
${fixtureLines}
  ],

};
`;
}

(async function main(){
  try {
    const [mData, sData] = [await get(`${BASE}/matches`), await get(`${BASE}/scorers?limit=30`)];
    const built = build(mData.matches || [], sData.scorers || []);
    const stamp = new Date().toISOString();
    const out = render(built, stamp);
    const target = process.env.OUT || path.join(__dirname, '..', 'results.js');
    fs.writeFileSync(target, out);
    const alive = Object.values(built.teams).filter(t => !t.out).length;
    const outc = Object.values(built.teams).filter(t => t.out).length;
    console.log(`✓ results.js updated — ${alive} alive / ${outc} out, ` +
      `${Object.keys(built.topScorerGoals).length} scorers, ${built.recentMatches.length} recent, ` +
      `${built.fixtures.length} fixtures, ${built.totalGoals} goals.`);
  } catch(e){
    console.error('✗ Update failed:', e.message);
    process.exit(1);
  }
})();
