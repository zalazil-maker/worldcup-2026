# WC2026 Betting App — Developer Guide (for future Claude agents)

This is a **single-page Progressive Web App** for a group of friends to follow,
vote on attendance, and bet (with fake money) on World Cup 2026 matches they
watch together. It is in **French**. This document explains how everything works
so you can extend it without breaking sync.

---

## 1. Architecture at a glance

| Piece | Where | Role |
|-------|-------|------|
| **`index.html`** | repo root (~4100 lines) | The ENTIRE app: HTML + CSS + JS all inline in one file. This is 99% of the work. |
| **`firebase-config.js`** | repo root | Firebase keys, `FIREBASE_ENABLED`, `ADMIN_PIN`, odds-API key, FCM VAPID key. |
| **`sw.js`** | repo root | Service worker. Handles **push notifications only** — it does NOT cache files. |
| **`manifest.json`** | repo root | PWA manifest (install as app). |
| **Firestore** | Firebase cloud (project `wc2026-2f20c`) | ALL live data: users/balances, bets, votes, results, broadcasts. |
| **Cloud Function** | (separate, not in this repo's active files) | Sends FCM web-push when a broadcast doc is written. |

**Key mental model:** The HTML file is just a *renderer*. All real state lives in
**Firestore** and streams into the page via `onSnapshot` listeners. Editing
`index.html` never touches user data. Wiping Firestore never changes `index.html`.

---

## 2. Deployment — how code reaches users

- The app is served by **GitHub Pages** from the `main` branch of
  `zalazil-maker/worldcup-2026` at `https://zalazil-maker.github.io/worldcup-2026/`.
- **Push to `main` = deploy.** `git push origin main` goes through a local proxy
  (`127.0.0.1:...`) which DOES sync to GitHub. Verify with the
  `mcp__github__get_commit` tool (sha of `main`).
- Also keep the feature branch in sync when required:
  `git push origin main:claude/<branch-name>`.
- GitHub Pages can take **1–2 minutes** + has CDN caching. If a user says
  "nothing changed", it is almost always **stale cache**, not a missing push.
  - Confirm the commit is on GitHub first (`get_commit`).
  - Tell them to hard-refresh / clear cache. As a nuclear option, bump the
    `<!-- vXXXXXXX -->` comment near the top of `index.html` to force a new
    file hash and re-deploy.
- The service worker (`sw.js`) does NOT cache the HTML, so SW is rarely the
  cache culprit — browser/CDN cache is.

### Syntax check before every push (MANDATORY)
The whole app is one `<script>`. A single syntax error = blank page for everyone.
Always validate before committing. `node --check` gives false positives on
top-level `await`, so use a brace-balance check instead:

```bash
node -e "
const fs=require('fs');
const html=fs.readFileSync('/home/user/worldcup-2026/index.html','utf8');
const s=html.lastIndexOf('<script>')+'<script>'.length;
const e=html.lastIndexOf('</script>');
const js=html.slice(s,e);
let o=0,c=0; for(const ch of js){if(ch==='{')o++;else if(ch==='}')c++;}
console.log(o===c?'BALANCED ✓':'UNBALANCED ✗ '+o+'/'+c);
"
```
Balanced braces ≠ proof of correctness, but an imbalance is a guaranteed bug —
this has caught real breakages (a dropped function declaration during an edit).

---

## 3. Firestore data model

All paths are exact. Reads use `onSnapshot` (realtime); writes use `setDoc` /
`runTransaction` / `deleteDoc`.

| Path | Doc shape | Notes |
|------|-----------|-------|
| `users/{uid}` | `{ name, balance, platform, installed, notif, firstSeen, lastSeen, fcmToken }` | **The balance lives HERE, in `users`, NOT in a `balances` collection.** The in-memory JS var is called `balances` but it mirrors the `users` collection. This naming trap has caused bugs — always write balance to `doc(db,"users",uid)`. |
| `matches/{matchId}/votes/{uid}` | `{ name, coming, bringing }` | Attendance + what they bring. |
| `matches/{matchId}/bets/{betId}` | see below | One doc per bet. |
| `results/{matchId}` | `{ settled, homeScore, awayScore, firstScorer, settledBy, settledAt }` | `firstScorer` ∈ `"home"|"away"|"none"`. |
| `broadcast/latest` | `{ title, body, sentAt }` | Writing this triggers the Cloud Function → web push to everyone. Also drives the in-app banner. |

**Bet doc shape:**
```js
{
  userId, name,
  market: "result"|"totals"|"firstScorer",   // top-level = first leg (back-compat)
  selection: "home"|"draw"|"away"|"over"|"under"|"none",
  label,                  // human text, e.g. "Pays-Bas marque en 1er"
  stake, odds, potentialWin,
  status: "open"|"won"|"lost"|"cheated",
  createdAt,              // Date.now() — REQUIRED, used for timestamps + cheat detection
  scoreAtBet: {home,away}// only set if placed while match was live (anti-cheat)
  legs: [ {market,selection,odds,label,scoreAtBet?} ]  // ONLY present for combined bets (>1 leg)
}
```

`uid` is a random id in `localStorage` under `wc2026_uid` (see `userId()`).

---

## 4. The MATCHES array — how to add matches (do it exactly like this)

`MATCHES` is a JS array near the top of the `<script>` (search `id: "m01"`).
Matches are rendered in array order. IDs are `m01`, `m02`, … sequential.

### Step-by-step (what was done last time, m18–m22):

1. **Find the last match** (`grep -n 'id: "m' index.html`) and append after it,
   before the closing `];`.

2. **Add each match object** in this exact shape:
   ```js
   {
     id: "m18",
     date: "2026-06-22", time: "19:00",     // date = ISO yyyy-mm-dd, time = 24h HH:MM
     label: "Lundi 22 Juin 2026",           // French display label
     home: { name: "Argentine", flag: "ar" },
     away: { name: "Autriche",  flag: "at" },
   },
   ```
   - `flag` is a **lowercase ISO-3166 alpha-2** country code used by flagcdn.com
     (`https://flagcdn.com/w160/<flag>.png`). England is the special case:
     `gb-eng`. Check flagcdn supports the code.

3. **A "ceremony"/placeholder card** (e.g. "16ème de Finale" with unknown teams)
   uses `ceremony: true` and an empty away team:
   ```js
   {
     id: "m22", date: "2026-06-28", time: "21:00",
     label: "Dimanche 28 Juin 2026",
     ceremony: true,
     home: { name: "16ème de Finale", flag: "" },
     away: { name: "", flag: "" },
   },
   ```
   `ceremony: true` cards skip betting, live scores, and odds. The ceremony card
   text comes from `m.home.name` (falls back to "Cérémonie d'ouverture").
   Everywhere that iterates matches for betting/scores/settlement already guards
   with `if (m.ceremony) ...` — preserve that.

4. **Add team ratings** for any NEW team to `TEAM_RATINGS` (Elo-style numbers;
   higher = stronger). Missing teams fall back to `DEFAULT_RATING` (1700) but you
   should add real values so odds make sense:
   ```js
   "Argentine": 2040, "Autriche": 1750, "Irak": 1530, "Ghana": 1620,
   ```
   Ratings drive `baseProbs()` → `computeOdds()` → the pre-match odds.

5. **Add NAME_MAP entries** for any NEW team — maps our **French** name to the
   **English** name used by TheSportsDB live-score API. Without this, live scores
   and auto-settlement won't match the match:
   ```js
   "Argentine": "Argentina", "Autriche": "Austria", "Irak": "Iraq", "Ghana": "Ghana",
   ```

6. **Syntax-check** (brace balance), commit, push to `main`. Done — the new cards
   appear for everyone; Firestore subcollections (`matches/m18/bets` etc.) are
   created lazily on first write.

That's the whole recipe. No Firestore migration needed — new match IDs just work.

---

## 5. Betting mechanics

- **Markets:** `result` (1/N/2), `totals` (over/under 2.5), `firstScorer`
  (home/away/none). Labels in `MARKET_LABELS`, odds in `computeOdds(matchId)`.
- **Odds:** real Bet365 odds from odds-api.io when available (`liveOdds`),
  otherwise an internal Elo/Poisson model from `TEAM_RATINGS`. Live matches get
  a live model.
- **Placing a bet** (`placeBet`): debits balance atomically via `runTransaction`,
  writes the bet doc. Requires the user voted "Je viens" (coming) for that match.
- **Combined bets:** click multiple markets → each becomes a *leg*. `selectBet()`
  accumulates legs (same selection again = toggle off; different selection in same
  market = replace). Combined odds = product of leg odds. Stored in `bet.legs[]`.
  Single bets do NOT get a `legs` array (kept flat for back-compat).
- **Cancelling** (`cancelBet` user-side, `adminCancelBet` admin-side): both prompt
  for a refund amount (full stake / 0 / custom; admin can enter a negative number
  to deduct). User can only cancel their own **open** bets on **unsettled** matches.
  Admin can cancel any bet.
- **Live betting** is capped at `LIVE_MAX_STAKE`. Bets close at kickoff
  (`LIVE_STATUSES` / `DONE_STATUSES`).

---

## 6. Anti-cheat (firstScorer)

The exploit: betting "X marque en premier" *after* X already scored.

- When a bet is placed during a live match, `scoreAtBet:{home,away}` is recorded.
- `betLegWins()` returns the string `"cheated"` (not `true`/`false`) if a
  `firstScorer` leg's `scoreAtBet` shows the chosen team had already scored.
- `betWins()` propagates `"cheated"` if ANY leg cheated.
- Settlement maps `"cheated"` → `status:"cheated"`, **stake lost, no payout.**
- The betting UI also **locks** firstScorer buttons live once that team scores,
  and `placeBet()` blocks the attempt as a second line of defence.
- **Retroactive penalty:** `penalizeMatchCheaters(matchId, goalTs)` scans all
  bets on a match, flags firstScorer/home bets created after `goalTs` as cheated,
  deducts a 50 € fine, and broadcasts a warning. There's an admin button for the
  m13 (Pays-Bas) case using `M13_GOAL_TS`.

---

## 7. Settlement (how balances get paid)

Three entry points, all idempotent via a Firestore transaction that re-checks
`status === "open"` before paying (prevents double-credit across devices):

1. **`settleMatch(matchId)`** — admin enters final score + first scorer manually.
2. **`autoSettleFromLive(matchId)`** — when live score reaches a DONE status.
   ⚠️ It CANNOT know the real first scorer from the final score. It only sets
   `firstScorer` for a clean shutout (`hs>0 && as==0` → home, etc.); any draw or
   ambiguous score leaves `firstScorer:"none"` so firstScorer bets are NOT
   wrongly awarded. **Admin must use "✏️ Corriger résultat" to fix first scorer.**
   (A previous bug used `hs>=as?"home":"away"` which wrongly paid "home scores
   first" on every draw — do not reintroduce that.)
3. **`settleOpenBets(matchId)`** — cleans up bets left "open" after a result
   exists (race-condition recovery).

`forceResettleMatch(matchId)` re-settles an already-settled match with a corrected
score, clawing back / adding payouts as needed.

`recalcAllBalances()` (admin "🔧 Corriger soldes") recomputes every balance from
scratch: `100 − Σstakes + Σwins`. Use this to fix any drift / double-credit.

---

## 8. Admin panel

Open with the ⚙️ button → PIN gate (`ADMIN_PIN` in firebase-config.js, currently
`2026`). `renderAdminDashboard()` builds it. Features:
- Player table: balance, device, install/notif status, with per-player buttons
  **🔍 audit**, **✏️ adjust balance**, **🗑️ delete**.
- **🔍 audit** (`auditPlayer`) opens a dedicated modal (`#audit-modal`) showing the
  player's full chronological bet history with running balance, match results,
  cheat explanations, summary stats, and a balance-mismatch warning. (This
  replaced an old `alert()` that couldn't render HTML or scroll.)
- Attendance per match, all group bets, manual settlement forms, result
  correction, reprice open bets, recalc balances, retroactive cheat penalty.
- 📣 Broadcast: writes `broadcast/latest` → Cloud Function → web push to all.

---

## 9. Realtime listeners & render flow

- Bootstrap IIFE at the very bottom: `registerSW → initFirebase → setupNameModal
  → initUser → renderMatches`, wrapped in try/catch that prints a visible error
  instead of a blank page.
- `renderMatches()` builds all cards (each `buildMatchCard` in its own try/catch
  so one bad card can't kill the page), then on first run subscribes:
  `subscribeToMatch(id)` for every match (votes, bets, results) +
  `subscribeBalances()` (the `users` collection) + `subscribeBroadcast()`.
- Any Firestore change re-renders the affected section. `applyPastHiding()`
  collapses matches >130 min past kickoff (`isOver`); a toggle reveals them.
- Live scores: `startLivePolling()` polls TheSportsDB (adaptive interval, faster
  when something is live), matched to our matches via `NAME_MAP`.

---

## 10. Gotchas / lessons learned (read before editing)

- **Balance is in `users/{uid}`.** Writing to a `balances` collection silently
  does nothing. The JS var named `balances` is a mirror of `users`.
- **`createdAt` is required** on every bet — timestamps + anti-cheat depend on it.
- **Live score fields are `home`/`away`** on the liveScores object, NOT
  `homeScore`/`awayScore` (those are on `results`). Mixing them up made every
  `scoreAtBet` read 0-0. Double-check field names.
- **`idLeague` from the API is numeric** — compare with `+e.idLeague === WC_LEAGUE_ID`
  (`WC_LEAGUE_ID` is the number 4429).
- **Don't dim/collapse a match at kickoff** — only after `isOver()` (130 min),
  so live matches stay bright.
- **Never use `mcp__github__push_files` with partial content** — it overwrote
  `index.html` with a truncated file once. Use `git push` (full working tree).
- **Match ID format is `mNN`** zero-padded, sequential. Keep it consistent.
- After adding teams, ALWAYS update BOTH `TEAM_RATINGS` and `NAME_MAP`.

---

## 11. Quick task recipes

- **Add matches:** §4. Append to `MATCHES`, add ratings + name map, syntax-check, push.
- **Fix a wrong result/payout:** admin → ✏️ Corriger résultat (`forceResettleMatch`),
  or 🔧 Corriger soldes (`recalcAllBalances`) for a full balance rebuild.
- **Investigate a suspicious balance:** admin → 🔍 audit on that player.
- **Penalize cheaters retroactively:** `penalizeMatchCheaters(matchId, goalEpochMs)`.
- **Notify everyone:** admin → 📣 broadcast (or write `broadcast/latest`).
- **"Nothing changed after push":** verify sha via `get_commit`, then it's cache —
  bump the `<!-- vXXX -->` comment and re-push, tell user to hard-refresh.
