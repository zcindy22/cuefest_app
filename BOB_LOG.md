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

## 2026-11-19 — Prompt 7: web, phone layout, theme, demo location (Agent mode)

**You asked:** Follow Prompt 7. Web support, phone layout, theme polish, demo location chip, My Lineup placeholder tab. Ask for approval before changes.

**What I did:**

1. **Web support** — created `metro.config.js` with `.wasm` asset extension and COOP/COEP header middleware. Changed `app.json` from `output: "server"` → `"single-page"` (client-side only, no SSR, works with SQLite wasm). Fixed `+html.tsx` to always use the app background color (no dark-mode black). Changed `db/database.js` to use `openDatabaseAsync` instead of `openDatabaseSync` so the wasm worker has time to load. Created `web-proxy.js` — a small Node.js reverse proxy on port 8082 that injects `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers on every response, enabling `SharedArrayBuffer` for expo-sqlite in Chrome.
2. **Phone layout** — added a `webShell` / `phoneFrame` wrapper in `app/_layout.jsx`. On web, the entire app is centered in a `max-width: 430px` column on a slightly darker background (`#D8D7D2`). On narrow screens it fills full width. Native iOS/Android are unaffected.
3. **Theme polish** — updated `theme/theme.js`: exported `softShadow` (2 px offset, 25% black), applied to `cardStyle` and `buttonStyle`. Buttons now use `minHeight: 48` and `fontSize: 17` bold text with 2 px borders. Fixed all inline hard shadows in `index.jsx` and `stage-finder.jsx` to use the soft shadow values.
4. **Demo location** — added `settings` table to `db/database.js` (key/value, seeded with `demo_location = 'on'`). Created `lib/location.js` with `getStartLocation(db)`, `getDemoLocationSetting(db)`, and `setDemoLocationSetting(db, value)`. Created `components/DemoLocationChip.jsx` — a yellow/white tappable chip that reads/writes the settings table and shows "Demo location: ON/OFF". Added the chip to Getting There, Stage Finder, and Wear & Bring.
5. **My Lineup tab** — created `app/(tabs)/my-lineup.jsx` placeholder screen. Updated `app/(tabs)/_layout.jsx`: added My Lineup as the 3rd tab (order: Getting There, Stage Finder, My Lineup, Wear & Bring), replaced `SymbolView` (iOS-only) with emoji text icons that work on web and native.
6. **README** — added How to run section with two-terminal instructions, features list, and data sources.

**Result:** App runs at http://localhost:8082 in Chrome. All four tabs load. SQLite reads stages and plan_items. Demo location chip is visible on every screen. Phone-width layout centers the app on a wide browser window.

---

## 2026-11-19 — Polish pass: tab bar, Getting There compaction, phone frame (Agent mode)

**You asked:** Replace emoji tab icons with Ionicons, remove the black header bar, compact the Getting There screen to fit on one phone screen, shorten the timeline connector line, fix tab label clipping, constrain the web view to phone dimensions, and update README/BOB_LOG.

**What I did:**

1. **Ionicons tab bar** — replaced all four emoji tab icons with `@expo/vector-icons` Ionicons. Outline when inactive, filled when active: `navigate`, `map`, `musical-notes`, `bag-handle`. Labels: Space Mono 10 px, uppercase, `lineHeight: 13` to prevent clipping. `tabBarStyle` given explicit `height: 64`, `paddingTop: 6`, `paddingBottom: 8`, plus `useSafeAreaInsets` on native so the bar clears the home indicator.
2. **Header bar removed** — `headerShown: false` on all tabs in `_layout.jsx`. The Bebas Neue heading on each screen replaces it.
3. **Getting There compaction** — DemoLocationChip and transit badge on one `flex-wrap` row; timeline subtitles removed, dots shrunk (18→14 px), connector `minHeight` reduced and `flexGrow` used so it doesn't over-expand; `lineHeight: 16` on timeline labels; "Starting from" input and Open Directions pill button merged into one card; "Directions home or next stop" collapses with a caret (closed by default); Replan button and `n/3 used` counter badge in a compact row; Replan history collapses (closed by default); empty message shortened to "No sets yet. Add one in Stage Finder."
4. **Phone frame on web** — extended `web-proxy.js` to inject a `<style>` block into every HTML response, constraining `#root` to 390×844 px, centered on a gray `#888` background with rounded corners and a drop shadow. Removes the need for any framework-level wrapper.
5. **README** — tightened the How to run section: `npx expo start --web` (Terminal 1), `node web-proxy.js` (Terminal 2), open `http://localhost:8082`, one-sentence explanation of why the proxy is required.

---

