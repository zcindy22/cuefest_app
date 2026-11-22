# BOB_LOG.md — Cue app build log


## 2026-11-19 — Prompt 0: Restyle (cue-bob-prompts-v3.md)

**You asked:** Read cue-bob-prompts-v3.md, unzip cue-assets-v3.zip, follow Rules for every task and Prompt 0 only.

**What I did:**

1. Unzipped `cue-assets-v3.zip` → placed `cue-festival-map-v3.svg`, `cue-festival-map-v3.png`, `cue-map-data.json`, `cue-sample-lineup.csv` in `assets/`. Saved `cue-bob-prompts-v3.md` to project root.
2. Deleted old files: `assets/cue-festival-map-v2.png`, `assets/cue-festival-map-v2.svg`, `assets/fonts/SpaceMono-Regular.ttf`, `cue-bob-prompts.md`.
3. Uninstalled `@expo-google-fonts/bebas-neue`, `@expo-google-fonts/inter`, `@expo-google-fonts/space-mono`.
4. Installed `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/dm-sans`, `@expo-google-fonts/nunito`.
5. Rewrote `theme/theme.js` — new palette (#FFFAF2 bg, #1B1B22 ink, #FF7EB6 pink, #6FA8FF blue, #FFD84A yellow, etc.), three font families (Display/Body/Detail), 1.5px ink outlines, r16–100 radii, no shadows, full type scale (min 12).
6. Updated `app/_layout.jsx` — loads BricolageGrotesque_800ExtraBold, DMSans_400Regular/500Medium/700Bold, Nunito_600SemiBold/700Bold; removed old three font imports.
7. Rebuilt `app/(tabs)/_layout.jsx` — white bg + 1.5px ink top border; inactive tabs icon-only in muted gray; active tab = yellow outlined pill with icon + label (Display 14); tabs renamed Lineup, Discover, Map, Wear; Ionicons: calendar, sparkles, map, shirt.
8. Updated all inline styles in `index.jsx`, `my-lineup.jsx`, `stage-finder.jsx`, `wear-bring.jsx`, and `components/DemoLocationChip.jsx` — new colors, font names, sizes (all ≥13), 1.5px outlines, pill radii, removed all shadows, added `useSafeAreaInsets` and 20px side padding.

---


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


## 2026-11-19 — Prompt 10: My Lineup screen (Agent mode)

**You asked:** Follow Prompt 10. Migrate the sets table to 34 CSV acts, add taste/lineup tables, build the full My Lineup screen (Discover, Swipe, Matches, Timeline). Saturday acts only for Add to plan. Friday acts saveable but not plan-able. Use lineup_version flag in settings to control migration.

**What was cleared during migration (lineup_version gate):**
- `plan_items` — all rows (act copies tied to old set ids 1–39)
- `replan_log` — all rows (replan history tied to the old plan)
- `replan_state` — reset to replans_used=0, leave_home 17:00, transit_time 17:20, arrive_time 18:25, on_time
- `sets` — all 39 old generic "Sample Act N-M" rows replaced with 34 CSV rows (IDs 1–34)

**What I did:**

1. **`db/database.js`** — Changed `sets` from `AUTOINCREMENT` to plain `INTEGER PRIMARY KEY` so CSV ids 1–34 are preserved. Added `genre`, `subgenre`, `bio`, `day` columns (with `ALTER TABLE … ADD COLUMN` guards for existing DBs). Added three new tables: `taste_picks`, `swipes`, `saved_acts`. Added version-gated migration block: checks `settings.lineup_version = '1'`; if absent, clears `plan_items`, `replan_log`, resets `replan_state`, deletes old sets, inserts 34 CSV acts, then sets the flag. All 34 act times are `HH:MM` 24-hour — matching existing code throughout.
2. **`app/(tabs)/my-lineup.jsx`** — Full My Lineup screen replacing the placeholder:
   - **Discover** tab: 8 genre bubbles sized by act count (flex-wrap, no library). Tap to drill into subgenre bubbles. Tap a subgenre to toggle a pick (thick border + checkmark). Back button, picks chips, See My Matches button, Clear My Taste button.
   - **Swipe** tab: stack of up to 8 act cards (mostly from picked genres). Drag right/left or tap Like/Skip. `PanResponder` + `Animated` with button fallback. Saves to `swipes` table; likes also save to `saved_acts`.
   - **Matches** tab: all 34 acts scored and sorted. +3 subgenre pick, +1 genre pick, +2 liked subgenre, −1 skipped subgenre. "Simple rules, not AI" badge. Festival persona card (Wanderer / Purist / Mixer). Heart to save, ADD button for Saturday acts.
   - **Timeline** tab: Fri/Sat switch. Saved acts for the selected day as stage columns on a 17:00–24:00 vertical axis, scrollable sideways. Overlap detection (red border + ⚠). +PLAN button for Saturday. Friday banner note.
   - **Artist detail** overlay: initials tile, genre chip, subgenre, stage/day/time, bio, "sample act" note. Save, Add to plan (Sat only), Find on Map (writes `open_stage` to settings, navigates to Stage Finder tab).
3. **Stage Finder unaffected** — only selects the original 5 `sets` columns; migration is additive. Confirmed no reference to new columns.
4. **Replans unaffected** — `lib/replan.js` never reads `sets`. Confirmed.

---


## 2026-11-19 — Prompt 10: Discover screen

**You asked:** Rebuild my-lineup.jsx as the Discover screen with glow bubbles, act card with Like/Skip, Matches tab with scored ranking, and ArtistCard component. Show migration plan first, then go.

**What I did:**

1. Confirmed no new DB migration needed — `sets` already has all 34 CSV acts with `genre`, `subgenre`, `bio`, `day`; `taste_picks`, `swipes`, `saved_acts` tables already exist; `lineup_version = '1'` gate already applied.
2. Noted `plan_items` stores copies of set data (act_name, start_time, etc.), not just set_ids — Lineup (Prompt 8) will handle the merge.
3. Created `components/ArtistCard.jsx` — reusable bottom-sheet modal (React Native Modal, slide animation) with initials tile, name, genre + subgenre chips, stage/day/time, bio, sample note, Save heart and Find on map button.
4. Rewrote `app/(tabs)/my-lineup.jsx`:
   - Replaced 4-tab layout (Discover | Swipe | Matches | Timeline) with 2-tab layout (Discover | Matches).
   - Discover tab: 8 genre glow bubbles via react-native-svg RadialGradient (soft edges, deep-shade ring, staggered flex-wrap, tap area ≥56px). Tapping a genre springs into subgenre bubbles (bloom animation via `Animated.spring`). Tapping a subgenre picks it (ink dot + bold label). Back link returns to genres. Act card with Like/Skip appears below bubbles once a subgenre is picked. Friday acts show "Plan covers Saturday" note.
   - Matches tab: 34 acts scored and ranked, with why line and heart to save to `saved_acts`. "Simple rules, not AI" label.
   - ArtistCard bottom sheet replaces the old `ArtistDetail` inline overlay. Find on map writes `open_stage` to settings and navigates to stage-finder.
   - Timeline tab removed from this screen (moves to Lineup in Prompt 8). `addToPlan`/`alreadyInPlan` removed from this screen.


## 2026-11-19 — Tab bar fix + Prompt 8: Lineup page

**You asked:** Fix active tab label clipping ("Lir" instead of "Lineup"), then rebuild index.jsx as the Lineup page.

**Tab bar fix (app/(tabs)/_layout.jsx):**
Removed `minWidth: 44`, added `alignSelf: 'center'` on the pill and `flexShrink: 0` on the label, `numberOfLines={1}`, and increased `paddingHorizontal` to 14. Pill now sizes to its content and all four labels show in full.

**What I did (Prompt 8):**

1. Created `components/ScheduleTimeline.jsx` — horizontal-scroll grid, one column per stage, 76px/hour time axis (17:00–24:00), 205px wide act blocks (min 76px tall, 64px minimum for short sets), colored initials tile (40px), Display 16 act name wrapping to 2 lines, Nunito 13 genre+time line, heart bottom-right. Saved acts get blue/pink tinted fill.
2. Rewrote `app/(tabs)/index.jsx` as `LineupScreen`:
   - **Header**: "Lineup" title + pale yellow "Sample day" pill + round yellow 40px navigate button (Ionicons `navigate-outline`), right-aligned, 10px gap.
   - **Day tabs**: Friday / Saturday in Display 24/28, Saturday default, pink underline on active.
   - **Segmented control**: Timeline | Saved | All acts.
   - **Timeline view**: renders `ScheduleTimeline` with all acts for the selected day.
   - **Saved view**: merges `saved_acts` and `plan_items` by `set_id` (no duplicates), time ordered, overlap chip, empty state → Discover button.
   - **All acts view**: flat list sorted by start time, hearts write to `saved_acts`.
   - **Directions**: `Linking.openURL` to Google Maps — adds `origin=Wynwood%2C%20Miami%2C%20FL` when Demo location is ON, no origin when OFF. No sheet, picker or input.
   - **Demo location row** at the very bottom, toggle ON/OFF pill.
   - **Removed from view**: commute timeline, transit badge, Replan button, replan history, Reset demo, Starting from card, Directions home card. Replan code and tables untouched.
3. No floating gear button found in the original code — nothing to remove.

**Bugs fixed:**
- `no-use-before-define` lint error: `useFocusEffect` was calling `loadAll` before it was declared. Fixed by moving `useFocusEffect` call after `loadAll`.
- Unused `labelStyle` import in both files removed.


## 2026-11-19 — Prompt 9: Stage finder map rebuild

**You asked:** Rebuild the Stage finder map from cue-map-data.json and cue-festival-map-v3.svg, with amenity icons, legend chips, Find nearest, and routing from any start to any stage or amenity.

**What I did:**

1. **`lib/routing.js`** — Added `AMENITIES` export (41 amenity positions matching cue-map-data.json), updated `getPosition()` to handle `amenity_N` ids, added `findNearestAmenity(startPos, type, startLabel)` which runs `calcRoute` to every amenity of a type and returns the nearest one with its route.
2. **`app/(tabs)/stage-finder.jsx`** — Full rebuild:
   - SVG map matches cue-festival-map-v3.svg: v3 block colors (yellow #FFE680, blue #C5DAFF, pink #FFC9E1, pale yellow #FFF0A8, light blue #D4E3FF), decorative side streets, dashed centerlines, street name labels (NW 5th Ave, NW 6th Ave, NW 23rd St, NW 22nd St plus three decorative names), 23 greenery circles, entrance tag, VIP ENTRY and VIP+ ENTRY tags, compass, 41 amenity icons with their SVG glyphs, 13 tappable stage pins.
   - Amenity chips scroll horizontally below the map, one per type with a colored dot. Tapping a chip toggles that type's visibility. Each chip has a "Find nearest" button that highlights the nearest amenity of that type and shows a route from the current start.
   - Nearest result banner shows the amenity type, start label, and simulated walk time.
   - Stage pin tap shows a card with Saturday-only acts (filtered by `day = 'Sat'`), genre+subgenre line, route, Add to my plan button with overlap check. Tapping an act name opens ArtistCard.
   - Pick start button: defaults to Entrance, tap a stage pin to change.
   - ArtistCard integrated from components/ArtistCard.jsx with save/unsave wired to saved_acts.
   - All text ≥13px, Display font for headings and act names, Nunito for times/genre, theme colors throughout.

---

## 2026-11-19 — Prompt 5: Wear and bring screen

**You asked:** Build the full Wear and bring screen with forecast, packing checklist, leave at home list, Attendee Picks accordion with filter+hashtag chips and seeded posts, add your own tip. Pull prompts from cue-bob-prompts-v3.md.

**What I did:**

1. **`db/database.js`** — Added `type` and `tags` columns to the `tips` table (via `ALTER TABLE` guards for existing DBs). Version-gated re-seed under `tips_version = '1'`: deletes old 6-row seed and replaces with 19 rows — 6 sourced tips (with source links), 6 sample tips, 4 fits and 3 reviews. Each row has `type` (tip/fit/review) and hashtag `tags`. Fits encode `title|pieces` in `tip_text`; reviews encode `text|verdict`.

2. **`app/(tabs)/wear-bring.jsx`** — Full rebuild:
   - **Forecast card**: condition, temp, rain chance with Ionicons icon and a `wearSuggestion()` helper that picks outfit advice based on the data. "Simulated" chip.
   - **Packing list**: scrollable rows with ink checkbox, label, checked/unchecked strike-through. User-added items show a pink "Mine" chip and an × to remove. Round outlined + button at the heading opens an inline text input + Add button. Items from Attendee Picks land here too via `addToPackingFromTip()`.
   - **Leave at home**: static list with pink ✕ icon per row.
   - **Attendee Picks accordion**: collapsed by default, tap to expand. Shows count chip + chevron. When open: disclaimer note, Last updated date, filter chips (All / Tips / Fits / Reviews), top-8 hashtag chips (computed from tag frequency), feed of tip cards (first 4 + Show more), Add your own tip form.
   - **Tip cards**: tips show body + source link or Sample badge + Add to my list; fits show icon tile, title, pieces; reviews show body + verdict chip (blue Worth it / yellow Mixed / pink Skip it).
   - **Add your own tip**: text + hashtags fields, saves to `tips` with `source_name = 'My tip'`, stays on device.
   - Removed `DemoLocationChip` (was left over from old screen).


## 2026-11-22 — Walking dot on illustrated map

**You asked:** Add a simulated "You" dot that walks the route on the Stage finder map, with a step banner, arrival state, and Find on map wiring.

**What I did:**

1. **`app/(tabs)/stage-finder.jsx`** — all changes in one file:
   - Added `interpolatePolyline(polyline, t)` helper: walks polyline segments proportionally to a 0–1 progress value and returns `{x, y}`.
   - Added `polylineSegFractions` and `buildSteps(polyline, destStageId, stages, amenityTypes)`: computes 2–4 named step strings from interior polyline waypoints, referencing nearby stages or amenities within 180 map units, with a final "Stage N is ahead" step.
   - Added `walkProgress` state (null = off, 0–1 = running/arrived), `walkIntervalRef`, `walkStepsRef`.
   - Added `startWalk()`: 15-second fixed-duration playback, `setInterval` at 50ms increments.
   - Added `stopWalk()`: clears interval, resets progress to null.
   - Extracted `selectStage(stageId)`: shared route-selection logic used by pin tap, `open_stage` handler, and `onFindOnMap`.
   - `useFocusEffect` now reads `open_stage` from settings on every focus, calls `selectStage`, clears the flag.
   - Added overlay SVG (`position: absolute`, same viewBox) containing only the "You" dot circle + label — main map SVG never re-renders during animation.
   - Walk banner appears above the map while walking: shows current step text, "Simulated walk, not live GPS" label, and "You've arrived at Stage N" on arrival.
   - Walk / Stop button added to stage card below the walk time line.
   - `onFindOnMap` in ArtistCard (within stage finder) now calls `selectStage(act.stage_id)` instead of being a no-op.

