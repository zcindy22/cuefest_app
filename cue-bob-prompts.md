# Cue for Bob: plan, screens and prompts (round 2)

## Files to put in the project
Put these in the assets folder: cue-festival-map-v2.svg, cue-festival-map-v2.png, cue-map-data.json and cue-sample-lineup.csv. The older mockup PNGs and the old cue-festival-map files are removed from assets. Replace the old cue-bob-prompts.md in the project folder with this one. Attach this file to every new task.

## Order of work
Start a new task for each prompt. Commit when each one is done.
1. Prompt 7 (web, phone layout, theme, demo location). Do this first. Commit.
2. Prompt 9 (Stage finder map and live map) and Prompt 10 (My lineup) in two tasks. Prompt 10 changes the sets table, so start Prompt 10 first and approve its migration plan before you start Prompt 9. After that they can run side by side. Each task may only edit its own screen file plus the data files it needs. Commit after each.
3. Prompt 8 (Getting there upgrades) and Prompt 5 (Wear and bring) at the same time. Commit after each.
4. Prompt 6 (connect and polish). Commit.
Prompts 1 to 4 are already done. They are kept below for reference. The replans from Prompt 4 are on hold, so do not change them.

## What each screen does

**Getting there**
- Shows the sample festival day as a timeline: leave home, transit, arrive at the entrance, then each set you added.
- A transit status badge, labeled simulated.
- A big rounded button that opens Google Maps directions to the festival entrance. The start can be my current location, a demo hotel, or a typed address, and the travel mode can be transit, walk, drive or bike.
- A "Directions home or next stop" box: type any address, tap a button, and Google Maps opens with directions from the festival entrance to it. What you type is not saved.
- A Replan button with 3 scripted disruptions (already built, on hold).
- A replan history list.

**Stage finder**
- Two views: Schematic and Live map.
- Schematic: Cue's own illustrated map of the festival grounds with the streets, 13 numbered stage pins, the entrance, greenery and amenity icons (first aid, water, restrooms, food, cocktail bar, merch, info, lost and found, lockers, accessible viewing, box office). A legend that doubles as filter chips. A search box.
- Tap a stage to see its name and sample acts, a walking route drawn along the streets of the map with a simulated time, and an Add to my plan button. A warning if two sets overlap.
- Find nearest: tap an amenity chip and the app shows the nearest one from the start point with a simulated walking time.
- Live map (web only): a real map with a Map and Satellite toggle, the 13 stage pins, the entrance and a dot for the user's location. An Open walking directions in Google Maps button.

**My lineup (new)**
- Discover: genre bubbles. Tap one and it splits into smaller subgenre bubbles. Pick the ones you like.
- Swipe: a few act cards to like or skip. This sharpens the matches.
- Matches: acts ranked by simple rules, with a "why this match" line.
- Timeline: the acts you saved, shown by stage and time, with a heart, an overlap warning and an Add to plan button.
- About this artist card: bio, genre, stage and time, with a Find on map button.
- Everything about taste stays on the device. All acts are invented sample acts.

**Wear and bring**
- A simulated forecast card and a what to wear suggestion based on it.
- A packing checklist you can tap, saved on the device.
- A leave at home list.
- "What attendees ran into": short tips with hashtag chips you can tap to filter. Tips from public news coverage show their source link. Sample tips written for this demo are labeled Sample.
- Add your own tip with hashtags. Add to my list on any tip.
- My list: add, edit, delete and check off your own items.
- No real posts, no names, nothing from social media. The lab rules say no personal data and no data obtained from social media.

## How the screens link
- One local SQLite database is shared by all screens.
- Stage finder and My lineup both write to the plan table. Getting there reads it.
- A replan updates the plan table and writes to the replan log. The third replan is a rain alert that updates the forecast and adds a rain jacket to the packing list.
- My lineup can send you to Stage finder with a stage selected.
- Screens refresh from the database whenever you switch to them.
- Navigation is Expo Router tabs: Getting there, Stage finder, My lineup, Wear and bring.

## Look and feel
Inspired by festival site colors, but with Cue's own name, icons and artwork.
- Background: soft off white, about #F0EFEA
- Text and borders: black
- Accents: yellow about #E8DC5A, pink about #DFA0DB, blue about #7C9CF0, plus green #9CC76B, orange #E08A3C and red #DE5560 for bubbles and chips
- Headings: Bebas Neue, large and bold
- Small labels and badges: Space Mono
- Body text: Inter
- Buttons: text at least 17 px and bold, at least 48 px tall, pill shaped for the main actions
- Borders: 2 pixels. Shadows: soft, a 2 pixel offset at about 25 percent black
- Mobile first. Design for a 390 pixel wide phone screen with tap targets of at least 44 pixels.

## Demo location
The app reads the real location by default for real use. For the demo recording there is a visible Demo location switch. When it is ON, the app uses a sample hotel near the venue. When it is OFF, it uses the real location after I allow it. A location is never saved or logged.

## Stage pin positions
Use these on the 800 by 900 map. The entrance is at x 332, y 757. The same numbers are in cue-map-data.json.

| Stage | x | y |
|---|---|---|
| 1 | 435 | 560 |
| 2 | 200 | 640 |
| 3 | 150 | 520 |
| 4 | 230 | 460 |
| 5 | 85 | 500 |
| 6 | 220 | 260 |
| 7 | 420 | 130 |
| 8 | 400 | 220 |
| 9 | 480 | 280 |
| 10 | 560 | 230 |
| 11 | 590 | 140 |
| 12 | 650 | 520 |
| 13 | 680 | 640 |

## Google Maps links
Use this pattern for directions to the festival entrance. Leave out the origin when the start is the person's current location. Add origin=... when the start is the demo hotel or a typed address, URL encoded. Set travelmode to transit, walking, driving or bicycling:
https://www.google.com/maps/dir/?api=1&destination=2217%20NW%205th%20Ave%2C%20Miami%2C%20FL&travelmode=transit

Open it with Linking.openURL. It needs no API key. Google Maps can't route inside the festival grounds, so routes between stages are drawn by the app.

## In app routing on the map
Treat the street centerlines on the 800 by 900 map as a graph. The same data is in cue-map-data.json under streets_routable.
- Horizontal streets: y 365 and y 750, both from x 30 to x 770.
- Vertical street at x 310, from y 90 to y 750.
- Vertical street at x 560, from y 365 to y 750.
- Junctions: (310,365), (310,750), (560,365), (560,750).
The thin streets NW 24th St, NW 25th St and NW 22nd Ln on the map are decorative. Do not route on them.

For each pin, amenity icon and the entrance, find the nearest point on any street centerline and add it as a node. Connect nodes along the streets, add the short link from each pin to its node, and find the shortest path with Dijkstra's algorithm. Draw the path as a thick dashed black line. Walking time is the path length divided by 80 map units per minute, rounded up, always labeled simulated. Put this in one function that takes a start and a destination, so other screens can reuse it.

## Sample lineup and taste rules
cue-sample-lineup.csv has 34 invented acts across 2 days (Fri and Sat) and 13 stages, with genre, subgenre, stage, day, start, end and a short bio. There are 8 genres and 24 subgenres. The names are invented and not real artists. Do not add photos or audio. Use a colored initials tile for each act, colored by genre.

Match score for an act, from the person's taste:
- plus 3 if its subgenre was picked in the bubbles
- plus 1 if only its genre was picked
- plus 2 if the person liked an act with the same subgenre in the swipe cards
- minus 1 if the person skipped an act with the same subgenre
Show the top matches first. Each match shows a why line, like "You picked Techno, Melodic". Label this "Simple rules, not AI".

## Mockups
The older mockup images were removed from assets. Use the written descriptions in this file and the v2 map for layout and style.

---

## Prompt 1: kickoff (Plan mode) [done]

```
I'm building a local demo app called Cue for the IBM SkillsBuild lab. Cue is a concierge for festival days. The demo is one sample festival day with a map of 13 stages. All data is simulated and must be clearly labeled as simulated or sample in the UI.

Rules for how you work with me:
- Ask for my approval before you create files, install packages, or run commands.
- Work in small steps and explain each one in plain language.
- Everything runs locally. Do not deploy anything. No API keys.
- No real personal data and no real people's reviews.
- Keep a file called BOB_LOG.md. After each step, add a short note on what you did and what I asked you.

Tech: Expo with Expo Router tabs, JavaScript, and expo sqlite for local data. Fonts from the Expo Google Fonts packages: Bebas Neue, Space Mono, Inter.

Three tab screens: Getting there, Stage finder, Wear and bring. All three share one SQLite database. Stage finder writes sets to a plan table, Getting there reads and replans that plan, and Wear and bring reads the forecast and packing list. A replan can change the forecast and packing list too.

Do not write code yet. Give me a short plan with the folder structure, the SQLite tables you would create, how the screens share data, and the order of work. Wait for my approval.
```

## Prompt 2: setup, theme and database [done]
(Already run. See the earlier version if you need it.)

## Prompt 3: Stage finder, first version [done]
(Already run. Prompt 9 below upgrades it.)

## Prompt 4: Getting there with replans [done]
(Already run. Prompt 8 below upgrades the buttons. The replans are on hold.)

## Prompt 7: web, phone layout, theme, demo location (new task, run first)

```
Read cue-bob-prompts.md. Follow Prompt 7 only. Extend the existing app. Do not rewrite or delete existing screens, tables or data. Ask for my approval before you create or change files, install packages or run commands. Everything stays local: no deploying, no API keys.

Goal: the app runs in a web browser on localhost and looks right on a phone sized screen.

1. Web. Run the app with npx expo start --web. Install react native web, react dom and @expo/metro-runtime if they are missing. Then make expo sqlite work on web. It needs Metro set up for wasm files and the headers Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy so SharedArrayBuffer works. Follow the current Expo SQLite docs for web setup. First confirm that the existing database and the Stage finder and Getting there screens load in the browser. If SQLite cannot work on web, stop and tell me what you found before you change the database approach.

2. Phone layout. Design mobile first for a 390 pixel wide screen. Nothing may scroll sideways at widths from 360 to 430. Tap targets are at least 44 pixels tall. On a wide browser window, center the whole app in a phone sized column (max width 430, full height) on a slightly darker background so it looks like a phone on a laptop. On a narrow screen use the full width.

3. Theme polish, in the shared theme file and shared components, not screen by screen. Button text is at least 17 px and bold. Buttons are at least 48 px tall. Shadows are softer: replace the hard black offset with a 2 pixel offset at about 25 percent black, and use 2 pixel borders. If a screen has its own inline styles for these, change only those style lines.

4. Demo location. Add a settings table with a key and a value. Add a small header chip on every screen that shows "Demo location: ON" or "Demo location: OFF" and toggles when tapped. It starts ON. Add one helper that other screens call to get the current start location. When ON it returns the sample hotel from the demo_hotel_xy and geo sections of assets/cue-map-data.json. When OFF it uses real browser geolocation, only after I allow it. Never save or log a location.

5. Add a fourth tab named My lineup with a placeholder screen so later tasks do not have to edit the tab layout. Tab order: Getting there, Stage finder, My lineup, Wear and bring.

Stop when the app runs in the browser on localhost with all four tabs. Add a How to run section to README.md with the commands. Add notes to BOB_LOG.md.
```

## Prompt 9: Stage finder map and live map (new task, run with Prompt 10)

```
Read cue-bob-prompts.md. Follow Prompt 9 only. Edit only the Stage finder screen file, new files for the map, and the shared data you need. Do not change the other screens. Ask for my approval before you change anything. Everything stays local, no API keys.

Part A: Schematic view.
Rebuild the Stage finder map from assets/cue-map-data.json and the reference drawing assets/cue-festival-map-v2.svg, using react native svg so everything is tappable. Draw the blocks, streets, street name labels, trees, the entrance tag, the VIP entry tags, the 13 numbered stage pins and the amenity icons from the JSON. Match the look of the reference. Keep the existing routing function and extend it so it works from any start to any stage or amenity.
- Under the map add the legend as chips, one per amenity type. Tapping a chip shows or hides that type on the map.
- Add a search box. Typing a stage number or an amenity name (like first aid or restrooms) highlights matching items and lets me pick one.
- Tapping a stage shows the card with its name and the sample acts at that stage from the sets table, a route from the start point drawn along the streets with a simulated walking time, and the Add to my plan button with the overlap warning you already have.
- Add a Find nearest button on each amenity chip. It finds the nearest icon of that type from the start point along the streets, highlights it and shows a simulated walking time.
- The start point defaults to the entrance. Keep the Pick start button.
- Keep the small note that the map is illustrative and not to scale.

Part B: Live map (web only).
Add a toggle at the top of the screen: Schematic | Live map. The Live map is a real map built with leaflet and react leaflet, loaded only on web. On a phone build, show a short note that the live map is web only in this demo. Ask me before installing packages.
- Two layers with a Map and Satellite toggle. Map uses OpenStreetMap tiles with the attribution "© OpenStreetMap contributors". Satellite uses Esri World Imagery tiles with the attribution "Tiles © Esri". Always show the attribution on the map.
- Pins: the 13 stages (numbered), the entrance, and a dot for the user's location from the demo location helper. Label the pins "approximate".
- Pin positions come from the geo section of assets/cue-map-data.json. The center_latlng value is empty on purpose. Ask me to paste the real latitude and longitude of the middle of the festival site (I can right click the spot in Google Maps and copy the coordinates). Do not guess it. Convert each pin with the formulas in the JSON. Remember that on this drawing up is east and right is south. Put meters_per_map_unit, the center and the conversion in one small file so I can adjust them if the pins look off against the satellite view.
- Tapping a pin shows its card. The card has an Open walking directions in Google Maps button that opens https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=walking. Add origin=LAT,LNG with the demo hotel coordinates when Demo location is ON, and leave out the origin when it is OFF. Add a note that Google Maps may not know the paths inside the festival, so this is approximate.
- Show the straight line distance to the pin in meters, labeled approximate.

Mobile first: the map fills the width, controls sit above or below it, tap targets are at least 44 pixels, and the chips scroll sideways.
Add the data sources to README.md under Data sources and attributions: OpenStreetMap contributors, Esri World Imagery, and a line that the map drawing and the sample acts are Cue's own.
Add notes to BOB_LOG.md.
```

## Prompt 10: My lineup (new task, run with Prompt 9)

```
Read cue-bob-prompts.md. Follow Prompt 10 only. Edit only the My lineup screen file and new files it needs, plus the database setup for the new tables. Do not change the other screens' files. If the new data breaks something on another screen, tell me instead of fixing it. Ask for my approval before you change anything. Everything stays local, no API keys, no audio, no photos.

Data. Use assets/cue-sample-lineup.csv. Show me a migration plan first. Use the existing sets table: add the columns genre, subgenre, bio and day if they are missing, replace the old Sample Act rows with the 34 rows from the CSV, and keep plan_items working. Add tables for taste_picks (subgenre), swipes (act_id and action like or skip) and saved_acts (act_id). All stored only on this device. Add a Clear my taste button that empties them.

Screen. A segmented control at the top: Discover | Swipe | Matches | Timeline. Mobile first for a 390 pixel wide screen.

1. Discover. Show the 8 genres as bubbles sized by the number of acts, packed together (a simple circle packing layout, no extra library). Colors from the theme palette. Tapping a genre bubble animates it growing and splitting into its subgenre bubbles, with the act count on each. Tapping a subgenre bubble selects it (a checkmark and a thick border). A Back button returns to the genres. Selected picks show as chips at the bottom with a See my matches button. Minimum bubble size is about 56 pixels across so it is easy to tap. Use the built in Animated API.

2. Swipe. A stack of act cards, up to 8, taken mostly from the picked genres and a few from outside them. Each card has a colored initials tile, the name, a genre chip, the stage, the day and time, and the short bio. Swipe right or tap Like to like, swipe left or tap Skip to skip. Use PanResponder and Animated with the buttons as a fallback for mouse users. Likes and skips are saved in swipes. A Like also saves the act to the lineup.

3. Matches. Rank the acts with the scoring rules in the Sample lineup and taste rules section. Each row shows the initials tile, name, genre chip, stage, day, time, the why line and a heart to save. Add the label "Simple rules, not AI". Add a small Your festival persona card on top: Wanderer if 4 or more genres were picked, Purist if 1 genre, Mixer otherwise, each with one friendly sentence.

4. Timeline. Show saved acts for the selected day (a Fri and Sat switch) as columns by stage with a vertical time axis from 17:00 to 24:00, scrollable sideways, only for stages that have a saved act. Each act is a block positioned by time with a heart. Highlight overlapping saved acts and show an overlap warning. Each block has an Add to plan button that writes to plan_items, with the overlap warning you already have.

5. About this artist card. Tapping any act name opens a card with the initials tile, name, genre and subgenre, stage, day and time, and the bio. Add a line saying this is a sample act invented for the demo. Add a Find on map button that opens Stage finder with that stage selected (pass it through the settings table or the router, whichever is simpler).

Label the matches and acts as sample. Add notes to BOB_LOG.md.
```

## Prompt 8: Getting there upgrades (new task, run with Prompt 5)

```
Read cue-bob-prompts.md. Follow Prompt 8 only. Edit only the Getting there screen file. Do not change the replans or any other screen. Ask for my approval before you change anything.

1. Make the Open directions button a large pill with fully rounded corners, full width, bigger bold text. It opens Google Maps directions to the festival entrance (2217 NW 5th Ave, Miami, FL).
2. Add a start point picker above it with three choices: My current location, Demo hotel, Type an address. Default to Demo hotel when Demo location is ON and My current location when it is OFF.
   - My current location: leave out the origin so Google Maps uses the real location.
   - Demo hotel: use the sample hotel coordinates from the demo location helper as the origin. If the coordinates are not set yet, use Wynwood, Miami, FL as the origin.
   - Type an address: URL encode what I type as the origin. Do not save it anywhere.
3. Add a travel mode picker: Transit, Walk, Drive, Bike. They map to travelmode transit, walking, driving and bicycling. Default Transit. The button uses the chosen start and mode.
4. Keep the Directions home or next stop section and add the same mode picker to it.
5. Use the shared button and theme styles for bigger text and softer shadows.
Add notes to BOB_LOG.md.
```

## Prompt 5: Wear and bring with hashtags (new task, run with Prompt 8)

```
Read cue-bob-prompts.md. Follow Prompt 5 only. Build only the Wear and bring screen, in its own file. Do not change the other screens except to read and write shared data in the database. Ask for my approval before you change anything.

Show a forecast card from the forecast table, labeled simulated, and a what to wear suggestion based on it. Show a packing checklist from packing_items where I can tap items to check them off, saved in the database. Show a leave at home list. When the forecast changes after a replan, show the new suggestion and the new packing items.

What attendees ran into. List the rows from the tips table. Each tip is one or two lines with no names and no ratings. Tips that have a source show it as a tappable link. Tips without a source show a Sample or General tip label. Each tip has an Add to my list button that adds a matching item to my packing list.

Hashtags. Add a tags column to the tips table. Show each tip's tags as hashtag chips. Tapping a chip filters the list to that tag, and tapping it again clears the filter. Show a row of the most used tags at the top. Add tags to the 6 existing tips: wristband tip #wristband #lines; rain tip #rain #weather; entrance tip #entrance #lines; attendance tip #crowds #lines; re entry tip #entrance #rules; charger tip #battery #packlight.
Also seed these 6 sample tips, written for this demo, each labeled Sample with no source link:
1. "Comfy shoes win. You will walk way more than you think between stages." #shoes #walking
2. "Pick a meetup spot with your group before the biggest crowds build." #meetup #crowds
3. "A cheap clear poncho beats an umbrella in a packed crowd." #rain #packlight
4. "Fill your bottle at the water stations instead of buying more." #water #hydration
5. "Screenshot your ticket and your plan in case the signal drops." #phone #signal
6. "Bring earplugs. Your ears will thank you near the front." #earplugs #hearing
Add an Add your own tip box where I type a short tip and any hashtags. It saves to the tips table labeled My tip and lives only on this device. Do not fetch anything from Instagram, X, TikTok or any social platform, and show a note that the sample tips are written for this demo and not collected from social media.

Add a My list section where I can add my own items, edit them, delete them and check them off, all saved in the database on this device. Show a note that the sourced tips come from public news coverage, not from individual posts. Show a Last updated date at the top of the tips list, read from the database, and add a last_updated column to the tips table if it isn't there. Use today's date for the seeded tips.
Mobile first for a 390 pixel wide screen. Add notes to BOB_LOG.md.
```

## Prompt 6: connect and polish (new task, run last)

```
Read cue-bob-prompts.md. Follow Prompt 6 only. Now check that the four screens work together in the browser at a phone sized width. Tell me what you find before you fix anything.
- Add an act from My lineup to the plan, then confirm it shows up on Getting there.
- Add a set from Stage finder, then confirm it shows up on Getting there.
- Pick bubbles and swipe a few cards, then confirm the matches and timeline update.
- Tap Find on map from an artist card and confirm Stage finder opens on that stage.
- Press Replan three times and confirm each one updates the timeline and the history, and the third one also changes Wear and bring.
- Press Reset demo and confirm the plan goes back to the start.
- Switch Demo location on and off and confirm Getting there and the live map follow it.
Then apply the colors, fonts, button sizes and shadows consistently across all four screens, make sure every simulated or sample item is labeled, and update the README with how to run the app, a short list of features, and the data sources and attributions.
```
