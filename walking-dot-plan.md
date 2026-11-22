# Walking dot plan

## Overview

Add a simulated "You" dot that walks along the existing route polyline on the illustrated map in Stage finder. Everything runs on-device — no GPS, no network, no new packages. The dot is purely a demo playback.

The feature is additive: if you never tap Walk, the screen is identical to today.

---

## Sub-tasks

---

### Sub-task 1 — Overlay SVG and dot rendering

**Intent**
Add a second, tiny SVG that sits `position: absolute` over the main map SVG, using the same `viewBox="0 0 800 900"` and the same rendered width/height. It contains only the "You" dot — a filled circle and a small label. Because it is separate from the main map SVG, the ~200-element map never re-renders during animation.

**Expected outcomes**
- When `walkProgress` state is between 0 and 1, a yellow circle with a black "You" label is visible at the correct interpolated position on the map.
- The main map SVG is not touched and does not re-render during animation.

**Todo list**
- [ ] Add `walkProgress` state (number 0–1, or `null` when not walking) to the stage finder component.
- [ ] Add a `useRef` for the interval handle so it can be cleared.
- [ ] Write a pure `interpolatePolyline(polyline, t)` helper (in the component file, not in routing.js) that takes a `[[x,y],...]` array and a 0–1 progress value and returns `{x, y}`. Walk the segments proportionally to their cumulative length.
- [ ] Wrap the existing `<View style={styles.mapContainer}>` in a `position: relative` parent (it may already be one — check).
- [ ] Add a second `<Svg viewBox="0 0 800 900" width="100%" style={{ aspectRatio: ..., position: 'absolute', top: 0, left: 0 }}>` after the main map SVG inside the same container.
- [ ] Inside the overlay SVG render the dot only when `walkProgress !== null` and a `route` exists: a yellow `<Circle>` r=14 with ink stroke, and a `<SvgText>` "You" in Nunito Bold 11 centered below it.

**Relevant context**
- [`app/(tabs)/stage-finder.jsx`](app/(tabs)/stage-finder.jsx) — `route` state holds `{ polyline, minutes }` from `calcRoute()`.
- [`lib/routing.js`](lib/routing.js) — `calcRoute` returns `{ polyline: [[x,y],...], minutes }`.
- [`theme/theme.js`](theme/theme.js) — use `Colors.yellow` for the dot fill, `Colors.ink` for stroke and label.

**Status:** [x] done

---

### Sub-task 2 — Walk / Stop button and 15-second playback timer

**Intent**
Add a Walk button to the stage card that starts the animation, and a Stop button that cancels it. Playback is always 15 real seconds regardless of route length.

**Expected outcomes**
- Walk button appears on the stage card when a route is shown (i.e. `route !== null && selectedPin !== null`).
- Tapping Walk starts an interval that increments `walkProgress` from 0 to 1 over 15 seconds (tick every ~50ms, increment by `50/15000`).
- The button label changes to Stop while walking.
- Tapping Stop clears the interval and sets `walkProgress` to `null`.
- When progress reaches 1 the interval clears itself; the dot stays at the destination.
- Changing the selected pin or the start resets `walkProgress` to `null` and clears any running interval.

**Todo list**
- [ ] Add `startWalk()` function: clears any existing interval, sets `walkProgress` to 0, starts a new `setInterval` at 50ms that increments progress by `50/15000`; when progress >= 1, clamp to 1 and clear.
- [ ] Add `stopWalk()` function: clears interval, sets `walkProgress` to `null`.
- [ ] Add Walk / Stop button to the stage card section below the route time line. Style it as a secondary outlined pill button (matches theme `secondaryButtonStyle`), label "Walk" or "Stop".
- [ ] Call `stopWalk()` inside `handlePinTap` and whenever `startId` changes, so a new selection resets the animation.

**Relevant context**
- Stage card render block is around line 570 in [`app/(tabs)/stage-finder.jsx`](app/(tabs)/stage-finder.jsx:570).
- `secondaryButtonStyle`, `secondaryButtonTextStyle` are already imported from the theme.

**Status:** [x] done

---

### Sub-task 3 — Step banner and arrival state

**Intent**
While walking, show a banner above the map (or pinned between the header and the map) that displays the current step derived from the polyline turns. Steps are named after the nearest stage or amenity to each turn point. The last step says "Stage N is ahead." On arrival, the banner becomes "You've arrived at Stage N." A "Simulated walk, not live GPS" label is shown throughout.

**Expected outcomes**
- 2–4 step strings are computed from the polyline when Walk is tapped (not on every tick).
- The banner shows the step whose progress threshold the dot has just passed.
- Steps reference nearby landmarks by name (nearest stage or amenity to each interior waypoint).
- The final step always reads "Stage [name] is ahead."
- On arrival (progress = 1), banner reads "You've arrived at Stage [name]."
- A small muted label "Simulated walk, not live GPS" is visible while `walkProgress !== null`.
- Banner disappears when Stop is tapped or the selection changes.

**Todo list**
- [ ] Write a pure `buildSteps(polyline, stageId, stages, amenities)` helper (in the component file) that:
  - Takes only the interior waypoints (index 1 to length-2 — the street turns, not start/end).
  - For each turn point, finds the nearest named landmark (stage name from `stages` array, or amenity label from `AMENITY_TYPES`) within a threshold (e.g. 150 map units).
  - Returns an array of `{ threshold: number (0–1), text: string }` objects, where threshold is the cumulative progress fraction at that waypoint. Last entry is always `{ threshold: 0.75, text: "Stage N is ahead" }` if no closer landmark found.
  - Caps at 4 steps.
- [ ] Store the computed steps in a `walkSteps` ref (computed once in `startWalk`, not on every render).
- [ ] Add a `currentStep` derived value: the last step whose threshold ≤ `walkProgress`.
- [ ] Render the banner as a `View` between the header and the map container. Show step text in Display 15 and the "Simulated walk, not live GPS" label in Nunito 13 muted below it. Use `Colors.paleYellow` background with ink outline, r12, 20px side padding.
- [ ] When `walkProgress === 1`, override banner text with "You've arrived at Stage [name]" in a slightly bolder style.
- [ ] Banner is `null` when `walkProgress === null`.

**Relevant context**
- `stages` and `sets` are already loaded from DB in the focus effect in [`app/(tabs)/stage-finder.jsx`](app/(tabs)/stage-finder.jsx:186).
- `AMENITY_TYPES` and `AMENITIES` are already in the file.
- Interior waypoints of the polyline are the street junction nodes — typically 1–3 turns on this map.

**Status:** [x] done

---

### Sub-task 4 — Find on map opens stage card with route and Walk ready

**Intent**
When the user taps "Find on map" from an artist card in Discover or Lineup, the stage finder should open with that stage's card already selected, the route already drawn from the current start point, and the Walk button ready to tap.

**Expected outcomes**
- `useFocusEffect` in stage finder reads `open_stage` from the settings table on every focus.
- If `open_stage` is set, it calls the same logic as `handlePinTap(stageId)` — sets `selectedPin`, computes and sets `route`.
- After consuming the value, it clears `open_stage` in settings (set to empty string or delete the row) so it does not re-trigger on the next focus.
- The stage card and route are visible immediately when the tab appears, with no extra tap needed.
- Walk button is present and functional.

**Todo list**
- [ ] In the `useFocusEffect` callback in stage finder, after loading DB data, read `SELECT value FROM settings WHERE key = 'open_stage'`.
- [ ] If the value is a non-empty string that parses to a valid stage id (1–13), call the pin-tap logic to set `selectedPin` and compute `route`.
- [ ] Clear `open_stage` in settings immediately after consuming it (`UPDATE settings SET value = '' WHERE key = 'open_stage'`).
- [ ] Verify that `onFindOnMap` in [`app/(tabs)/stage-finder.jsx`](app/(tabs)/stage-finder.jsx:613) is currently a no-op (`() => setOpenAct(null)`) — it needs to be updated to also call the same find-on-map logic so that the artist card opened *from within* stage finder also works.

**Relevant context**
- `open_stage` write logic is in [`app/(tabs)/my-lineup.jsx`](app/(tabs)/my-lineup.jsx:383) and [`app/(tabs)/index.jsx`](app/(tabs)/index.jsx:185).
- Stage finder's `useFocusEffect` is at [`app/(tabs)/stage-finder.jsx`](app/(tabs)/stage-finder.jsx:186).
- `handlePinTap` is the function to reuse/extract — consider extracting its core route-calculation logic into a helper `selectStage(stageId)` so both the focus effect and the pin tap can call it.

**Status:** [x] done

---

## Implementation notes

- Do not modify `lib/routing.js`.
- Do not add any new packages.
- All new helpers (`interpolatePolyline`, `buildSteps`, `selectStage`) live in `stage-finder.jsx` — no new files needed.
- Run `npx expo lint` and `npx tsc --noEmit` after each sub-task before marking it done.
- Add a note to `BOB_LOG.md` after all four sub-tasks are complete.
- Commit when all four are done and clean.
