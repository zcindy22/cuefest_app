# BOB_LOG.md — Cue app build log

---

## 2026-11-18 — Prompt 1: Plan (Plan mode)

**You asked:** Read `cue-bob-prompts.md`, follow Prompt 1 only. Do not write code. Wait for approval.

**What I did:** Read the prompts file. Presented the plan — folder structure, SQLite table schemas, screen data flow, and order of work — for your review.

---

## 2026-11-18 — Prompt 2: Setup, theme and database (Agent mode)

**You asked:** "good to go." (approval to proceed with the plan)

**What I did:**

1. **Scaffolded the Expo app** using `create-expo-app --template tabs` (ran in `~/` to avoid the git-repo prompt, then copied files into the project folder).
2. **Restructured tabs** to three screens: `index.jsx` (Getting There), `stage-finder.jsx` (Stage Finder), `wear-bring.jsx` (Wear & Bring). Deleted the template's `index.tsx`, `two.tsx`, and `_layout.tsx`.
3. **Added the theme file** at `theme/theme.js` with colors (`#F0EFEA` background, `#E8DC5A` yellow, `#DFA0DB` pink, `#7C9CF0` blue), font family names, and reusable `cardStyle`, `buttonStyle`, `headingStyle`, `labelStyle`, `bodyStyle`.
4. **Installed packages:** `expo-sqlite`, `@expo-google-fonts/bebas-neue`, `@expo-google-fonts/space-mono`, `@expo-google-fonts/inter`.
5. **Created `db/database.js`** — opens SQLite (`cue.db`), creates 7 tables (`stages`, `sets`, `plan_items`, `replan_log`, `forecast`, `packing_items`, `tips`), and seeds all data on first run.
6. **Wired screens** — root layout initialises the DB and loads all four Google Fonts before the splash screen hides. Each screen uses `useFocusEffect` to reload its data when the tab is focused, and shows a heading + one real database row.
7. **Updated `app.json` and `package.json`** to name the app "Cue".

**Result:** Three tab screens load with Cue headings, theme colors, and live DB rows. Fonts: Bebas Neue (headings), Space Mono (badges), Inter (body).

---

## 2026-11-18 — Prompt 3: Stage Finder (Agent mode)

**You asked:** Build the Stage Finder screen with SVG map, tappable pins, in-app routing, set schedule card, Add to plan, overlap warning, and stage list. Also delete remaining duplicate nested folders.

**What I did:**

1. **Deleted duplicate folders:** `assets/fonts/fonts/`, `assets/images/images/`, `constants/constants/` — all were copy artifacts from the scaffold move.
2. **Installed `react-native-svg`** via `npx expo install`.
3. **Created `lib/routing.js`** — full Dijkstra implementation over the four street centerlines. `calcRoute(start, dest)` returns a polyline and walking time (path length ÷ 80 units/min, rounded up). `getPosition(id)` returns map coordinates for any stage or the entrance. Reusable by Getting There.
4. **Rebuilt `app/(tabs)/stage-finder.jsx`** as full implementation:
   - SVG map with street corridors, dashed centerlines, 5 colored blocks (yellow/pink/blue), block shadows, entrance tag, compass, and 13 numbered tappable pins.
   - Tap a pin: pin turns yellow, route drawn as thick dashed black line, card appears below map with stage name, 3 selectable sets (tappable rows), walk time labeled "simulated".
   - Pick Start button: turns pink, next pin tap sets it as start and recalcs route. Start pin turns pink on map.
   - Add to My Plan: overlap check against existing plan_items; Alert if overlap, then writes to DB.
   - Stage list: 13 numbered circles below map; tapping one is equivalent to tapping the pin.

---

## 2026-11-18 — Prompt 4: Getting There (Agent mode)

**You asked:** Build the Getting There screen with timeline, transit badge, Google Maps directions, Directions home/next stop, 3 scripted replans, replan card, history, and Reset demo.

**What I did:**

1. **Added `replan_state` table** to `db/database.js` — single row that stores `replans_used`, anchor times (`leave_home`, `transit_time`, `arrive_time`), and `transit_status`. Seeded with original demo values.
2. **Created `lib/replan.js`** — `runReplan(n, db)` runs scripted disruption 1, 2, or 3. `resetDemo(db)` restores everything to original. Fully isolated — swap the function body for an AI call later.
   - Replan 1: shifts leave home 15 min earlier, marks transit delayed
   - Replan 2: shifts all plan_items 30 min later
   - Replan 3: shifts plan_items 45 min earlier, updates forecast to rain, adds rain jacket to packing_items
3. **Rebuilt `app/(tabs)/index.jsx`** as the full Getting There screen:
   - Timeline: Leave home → Take transit → Arrive at entrance, then plan_items sorted by time. Yellow dots for anchors, pink for sets.
   - Transit badge: blue ON TIME / pink DELAYED (simulated)
   - Open Directions button (yellow) → Google Maps from current location
   - Directions home/next stop: text input (state only, never persisted), GET DIRECTIONS button builds URL with festival entrance as origin
   - Replan button (black): counter shows `(N of 3 used)`, disabled after 3rd
   - Latest replan card (pink): shows replan number badge, reason, what changed
   - Reset demo (yellow): appears after 3rd replan, clears plan and restores all original data
   - Replan history list below timeline

---

## 2026-11-19 — Asset refresh (Agent mode)

**You asked:** Unzip `cue-assets-v2.zip` into `assets/`, check whether the five old files are used anywhere, delete unused ones, then delete the zip.

**What I did:**

1. **Unzipped** `cue-assets-v2.zip` into `assets/` — added `cue-festival-map-v2.svg`, `cue-festival-map-v2.png`, `cue-map-data.json`, and `cue-sample-lineup.csv`.
2. **Searched** the entire codebase for references to the five old files. Found one comment-only mention of `cue-festival-map.svg` in `app/(tabs)/stage-finder.jsx` (line 4); no actual imports or runtime usage for any of the five.
3. **Deleted** all five old files: `cue_mockup_getting_there.png`, `cue_mockup_stage_finder.png`, `cue_mockup_wear_and_bring.png`, `cue-festival-map.png`, `cue-festival-map.svg`.
4. **Deleted** `cue-assets-v2.zip`.
5. `assets/fonts/` and `assets/images/` were left untouched.

---
