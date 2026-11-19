# Cue

Plan your festival day with Cue. Take control from the moment you leave home until you're back. Built with IBM Bob for the IBM SkillsBuild AI Experiential Learning Lab, Fall 2026 Cohort.

© 2026 Cindy Zheng. All rights reserved. Built for the IBM SkillsBuild AI Experiential Learning Lab.

---

## How to run

You need two terminal windows (or tabs).

**Terminal 1 — start the Metro bundler:**
```bash
npx expo start --web --port 8081
```

**Terminal 2 — start the COOP/COEP proxy (required for SQLite on web):**
```bash
node web-proxy.js
```

Then open **http://localhost:8082** in Chrome or any modern browser.

> The proxy injects the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers that Chrome requires before it enables `SharedArrayBuffer`, which expo-sqlite's WebAssembly engine depends on.

**To stop:** `Ctrl+C` in both terminals.

---

## Features

- **Getting There** — sample festival day timeline with leave home, transit, arrival and your planned sets. Scripted replans simulate transit delays, set time changes, and a rain alert.
- **Stage Finder** — illustrated SVG map with 13 tappable stage pins, in-app walking routes drawn along the festival streets, set schedules, and Add to plan.
- **My Lineup** — coming in Prompt 10. Discover acts by genre, swipe to like or skip, and get ranked matches.
- **Wear & Bring** — simulated forecast, packing checklist, attendee tips, and your own list.
- **Demo location chip** — toggle between a sample hotel location and your real location on every screen.

All data is simulated and clearly labeled. No real reviews, no personal data, no API keys.

---

## Data sources and attributions

- Map drawing and sample acts: Cue's own (illustrative only, not an official map).
- Attendee tips: drawn from public news coverage (BizBash) and the festival FAQ. No personal data, no social media data.
