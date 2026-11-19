# Cue for Bob: plan, screens and prompts (round 5, simulator build)

## Files to put in the project
Put these in the assets folder: cue-festival-map-v3.svg, cue-festival-map-v3.png, cue-map-data.json and cue-sample-lineup.csv. The map files were recolored for the new look, so replace any older copies. The older mockup PNGs and the old cue-festival-map files are removed from assets. This file replaces the older cue-bob-prompts.md in the project folder. Prompt 0 asks Bob to clean up the old files, so you do not need to delete them yourself. Attach this file to every new task.

## Rules for every task (keeps Bobcoin use low)
- Use only cue-bob-prompts-v3.md. The older cue-bob-prompts.md and any other older copy are out of date and must be ignored, along with any older look and feel instructions from earlier tasks.
- Give me your plan once, in at most 10 lines. After I say go, do all the steps without asking again. The only exceptions are installing packages and deleting files, which still need my approval.
- Do not reread files you have already read in this task. Edit only the files the prompt names.
- Keep replies short: no code summaries, no tables, no recaps. When you finish, tell me in 3 lines what changed.
- The app runs in the iOS simulator. Do not add web only features or packages. Do not spend turns on the web proxy.
- Do not decide on your own to change the approach (for example the database, the platform or the file layout). If something is blocked, tell me the exact error and wait.
- Add a short note to BOB_LOG.md at the end.

## Order of work
Start a new task for each prompt. Commit when each one is done.
1. Prompt 0 (restyle). Run it first so every screen after it is built in the new look. If an earlier green restyle was already applied, this one replaces it.
2. Prompt 10 (Discover). Approve its migration plan.
3. Prompt 9 (Stage finder map).
4. Prompt 8 (Lineup page). It reads the saved acts that Prompt 10 creates, so run it after Prompt 10.
5. Prompt 5 (Wear and bring).
6. Prompt 12 (satellite view on the Map tab). It is part of the plan now, but it is the first thing to drop if coins run low.
7. Prompt 6 (connect and polish).
8. Prompt 11 (festival persona card). Stretch only.
Prompts 1 to 4 and 7 are already done. They are kept below for reference. The replans and the commute timeline are removed from the screen. Leave their code and tables in place, just hide them.

## What each screen does
The app has four tabs: Lineup, Discover, Map and Wear.

**Lineup** (the old Getting there page, tab name Lineup. It is now the festival schedule.)
- Header: the title Lineup, and on the right side of the same row a small pale yellow "Sample day" pill with a round yellow outlined directions button (a navigate arrow icon) next to it, the pill on the left of the button, both vertically centered with the title and 10 pixels apart. The pill is right aligned so it never floats in the middle of the row. Tapping it opens Google Maps directly (see Directions below). There is no other directions UI on the page.
- Day tabs under the header: Friday and Saturday in big heavy type. Saturday is selected by default and is the sample festival day.
- A segmented control with three views: Timeline | Saved | All acts.
  - Timeline: columns by stage with a time axis down the left, from 17:00 to 24:00. Columns scroll sideways, about one and a half columns visible at a time. Each act is an outlined block placed by time, with a colored initials tile, the name, the genre and time, and a heart. Saved acts are filled with color (blue or pink).
  - Saved: only the acts you saved (from Discover and from Stage finder), as outlined cards in time order, with an overlap warning chip when two overlap.
  - All acts: a simple list of every act that day with a heart on each, sorted by start time.
  - Tapping an act's name opens the artist card. Tapping a heart saves or unsaves the act.
- Directions: the round yellow navigate button is a link, nothing more. One tap opens Google Maps directions to the festival entrance. The start is preloaded: the sample hotel when Demo location is ON, otherwise the real current location (leave out the origin). No travel mode, no picker and no sheet. The person picks walking, transit or driving inside Google Maps. The Demo location switch is a small row at the very bottom of the Lineup page, below the list, so it is available for the demo but out of the way.
- Removed from the screen: the commute timeline, the transit status badge, the Replan button, the replan history and the big Getting there card.

**Discover** (the old My lineup tab)
- Soft glowing genre bubbles. Tap one and it blooms into its subgenre bubbles. Pick the ones you like. A single act card sits under the bubbles with Like and Skip, and updates as you pick.
- A Matches view: acts ranked by simple rules with a "why this match" line.
- About this artist card: bio, genre, stage and time, with a Find on map button.
- Everything about taste stays on the device. All acts are invented sample acts.

**Stage finder** (tab label Map)
- A segmented control at the top: Illustrated | Satellite. Illustrated is the default. Satellite shows real satellite imagery of the neighborhood with sample stage pins on it (Prompt 12). The festival has already happened and stages are temporary, so the imagery shows the empty site. It is there to show that the app can run on real map data. The pins are labeled illustrative.
- Cue's own illustrated map of the festival grounds with the streets, 13 numbered stage pins, the entrance, greenery and amenity icons (first aid, water, restrooms, food, cocktail bar, merch, info, lost and found, lockers, accessible viewing, box office). A legend that doubles as filter chips.
- Tap a stage to see its name and sample acts, a walking route drawn along the streets of the map with a simulated time, and an Add to my plan button. A warning if two sets overlap.
- Find nearest: tap an amenity chip and the app shows the nearest one from the start point with a simulated walking time.

**Wear and bring**
- A simulated forecast card and a what to wear suggestion based on it.
- A packing checklist you can tap, saved on the device. A round plus button next to the Packing list heading opens a text field to type your own item (it appears in the same list with a small Mine label, and you can remove your own items with a small x). Items added from Attendee Picks land in the same list.
- A leave at home list.
- Attendee Picks: a dropdown row (title, a count chip and a chevron), collapsed by default. Open it to see a feed of sample posts with filter chips All, Fits, Reviews and Tips, plus tappable hashtag chips. Fits are outfit cards (an icon tile, a title, the pieces, hashtags). Reviews are short written takes with a Worth it, Mixed or Skip it chip. Tips are the short tips. Tips from public news coverage show their source link. Everything else is labeled Sample.
- Add your own tip with hashtags. Add to my list on any tip.
- No real posts, no names, nothing from social media. The lab rules say no personal data and no data obtained from social media.

## How the screens link
- One local SQLite database is shared by all screens.
- Discover saves acts to the saved_acts table. Stage finder writes to the plan table. Lineup reads both and shows them together in one list, without duplicates.
- Discover's artist card can send you to Stage finder with a stage selected.
- Screens refresh from the database whenever you switch to them.
- Navigation is Expo Router tabs: Lineup, Discover, Map, Wear. Map is the Stage finder screen and Wear is the Wear and bring screen. Only the tab labels use the short names; keep the screen titles Stage finder and Wear and bring. The route files keep their current names (index.jsx is Lineup, my-lineup.jsx is Discover). Only the tab titles and labels change.

## Look and feel
Bright, soft and a little dreamy, for Gen Z and millennial festival fans: pink, blue and sunny yellow on a light warm background, with near black text, bold outlines and buttons. No logos or artwork from any festival.

**Fonts: a family of three, used the same way on every screen.**
- Display: Bricolage Grotesque ExtraBold (@expo-google-fonts/bricolage-grotesque). For screen titles, day tabs, stage names, act names, button text and tab labels.
- Body: DM Sans (@expo-google-fonts/dm-sans), Regular and Medium and Bold. For sentences, chips, inputs and anything you read.
- Detail: Nunito (@expo-google-fonts/nunito), SemiBold and Bold. A soft rounded font for times, genre and stage lines, sample labels and small captions. No monospace or typewriter font anywhere, and no all caps small text. Write labels in sentence case, like Sample day, Start and How.
Install all three together once, with my approval, and load them with expo-font before the first screen shows.

**Type scale. Nothing smaller than 12 anywhere. Most text is bigger.**
- Screen title 36 to 40 (Display). Day tabs 28 selected and 24 unselected (Display). Section and stage headers 20 to 22 (Display).
- Act and card names 15 to 17 (Display). Body text 16 (DM Sans). Chips and button labels 14 to 15 (DM Sans Bold). Main button text 17 (Display).
- Times, genre lines and captions 13 (Nunito SemiBold). Small labels 14 (Nunito Bold). Active tab label 14 (Display).

**Outlines instead of shadows.**
- Cards, act blocks, chips, inputs, buttons and the sheet get a 1.5 pixel ink outline (#1B1B22) and no drop shadow. Corner radius 12 on act blocks, 16 to 20 on cards, fully round on pills.
- The glow bubbles and the map blocks keep their own style (soft blur and bold map outlines).

**Colors**
- Background #FFFAF2. Cards and sheets white #FFFFFF. Divider lines #E4D8C8.
- Text ink #1B1B22. Muted text #6E6E7A (dark enough to read).
- Pink #FF7EB6, blue #6FA8FF, sunny yellow #FFD84A (bright, not mustard). Helpers for bubbles and variety: peach #FF9A6B and lilac #B9A6FF. Pale yellow #FFF0A8 for sample and status chips. Soft fills for saved blocks: blue #BBD4FF and pink #FFC2DD.
- One meaning per color: yellow means selected or active (chips, active tab, the directions button). Pink means saved or on (hearts, switches, the day underline, the active dot). Blue and the other colors are for genres.
- Genre colors for the initials tiles and bubbles: Dance yellow, Techno blue, Bass peach, Latin pink, Indie lilac, Alt R&B pink, Electro blue, Hip hop yellow.

**Buttons and chips**
- Main button: ink pill with white text, 56 pixels tall, full width. Secondary button: white pill with the ink outline and ink text, 48 pixels tall.
- Chips: pill, 38 to 40 pixels tall, 14 point text. Selected is yellow with ink text and a bold label. Unselected is white with the ink outline.
- Segmented control: a white outlined pill, 48 tall, the selected segment is an ink pill with white text.

**Tab bar**
- White, with a 1.5 pixel ink line on top. Four Ionicons: calendar (Lineup), sparkles (Discover), map (Map) and shirt (Wear), outline style. Inactive tabs show only the icon in muted gray (#6E6E7A), and the active tab uses the filled version of its icon. The active tab becomes a yellow outlined pill with the icon and its label (Lineup, Discover, Map, Wear) in Display 14. No tiny labels under the inactive icons. Tap targets are at least 44 pixels.

**Layout**
- Respect the top and bottom safe area on every screen. 20 pixel side padding. Nothing may sit under the status bar or the notch. Do not put more than one main action on a screen.

**Glow bubbles (Discover).** Draw them with react native svg. Each bubble is a circle filled with a RadialGradient from the genre color at about 95 percent opacity in the center, to 65 percent at half the radius, to 0 percent at the edge, so the edges are soft and neighbors blend where they overlap. The label sits in the center in Nunito Bold 14, sentence case. Lay them out loosely and a little staggered, sized by the number of acts. Each bubble has a transparent tap area of at least 56 pixels across. Each bubble also gets a thin outline (1.5 pixels, about 85 percent opacity) in a deeper shade of its own color, drawn as a ring at about 80 percent of the bubble radius so the soft glow still fades out beyond it. Deeper shades: yellow #E0B000, blue #3F7FE8, peach #F2733F, pink #E8559B, lilac #8C73E6. A selected bubble gets a bolder label and a small ink dot under it.

## Demo location
The app reads the real location by default for real use. For the demo recording there is a visible Demo location switch (a small row at the bottom of the Lineup page). When it is ON, the app uses a sample hotel near the venue. When it is OFF, it uses the real location if the device provides one, and the sample hotel if it doesn't. A location is never saved or logged.

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
Use this pattern for directions to the festival entrance. Leave out the origin when the start is the person's current location. Add origin=Wynwood%2C%20Miami%2C%20FL when Demo location is ON. Do not set travelmode, so Google Maps uses its own default and the person can switch there:
https://www.google.com/maps/dir/?api=1&destination=2217%20NW%205th%20Ave%2C%20Miami%2C%20FL

Open links with Linking.openURL. They need no API key. Google Maps can't route inside the festival grounds, so routes between stages are drawn by the app.

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

## Prompt 0: restyle (new task, run first)

```
Read cue-bob-prompts-v3.md. Use only this version of the file and ignore any older copy and any earlier look and feel. Follow the Rules for every task section and Prompt 0 only. This is a styling pass only. Do not change any logic, data, database code or the structure of any screen. If a green or earlier look is in the code, replace it fully.

First, clean up. List every file in the project that is no longer needed and ask me once to approve deleting them all together. Candidates: any older copy of cue-bob-prompts.md, any cue-festival-map files that are not the v3 ones, the old cue_mockup files, any cue-ui-preview files, and any assets that no screen imports. Keep assets/fonts, assets/images, the Expo app icon and splash files, cue-festival-map-v3.svg, cue-festival-map-v3.png, cue-map-data.json, cue-sample-lineup.csv and this file. Also list the font packages that will no longer be used (Bebas Neue, Space Mono, Inter, Instrument Serif) and uninstall them in the same approval. Do not touch anything else.

Then apply the Look and feel section to the whole app:
1. Install @expo-google-fonts/bricolage-grotesque, @expo-google-fonts/dm-sans and @expo-google-fonts/nunito together (ask me once before installing) and load them with expo-font before the first screen shows. Stop loading Bebas Neue, Space Mono and Instrument Serif and remove their imports.
2. Update theme/theme.js with the colors, the three font families, the type scale (nothing under 12), the 1.5 pixel ink outline, corner radii and spacing. Remove the drop shadows.
3. Update the shared button, card, chip, segmented control, input and heading styles so every screen picks up the new look: outlined cards and chips, ink pill main buttons 56 tall, selected chips yellow, headings in Display.
4. Rebuild the tab bar in app/(tabs)/_layout.jsx as described: icon only for inactive tabs, a yellow outlined pill with icon and label for the active tab, white background with a 1.5 pixel ink top line. Set the tab titles to Lineup, Discover, Map and Wear (keep the route files as they are).
5. Fix the proportions on an iPhone sized screen. Use useSafeAreaInsets so no screen content sits under the status bar or notch, 20 pixel side padding, consistent vertical spacing of 12 and 20. The gap between content and the tab bar should look balanced.
6. Where a screen has its own inline colors, fonts, font sizes, radii or shadows, change only those style lines to use the theme. Raise any text under 12 to the scale in the Look and feel section.
Check each of the four screens in the simulator and tell me in 3 lines what changed.
```

## Prompt 1: kickoff (Plan mode) [done]

```
I'm building a local demo app called Cue for the IBM SkillsBuild lab. Cue is a concierge for festival days. The demo is one sample festival day with a map of 13 stages. All data is simulated and must be clearly labeled as simulated or sample in the UI.

Rules for how you work with me:
- Ask for my approval before you create files, install packages, or run commands.
- Work in small steps and explain each one in plain language.
- Everything runs locally. Do not deploy anything. No API keys.
- No real personal data and no real people's reviews.
- Keep a file called BOB_LOG.md. After each step, add a short note on what you did and what I asked you.

Tech: Expo with Expo Router tabs, JavaScript, and expo sqlite for local data. Fonts from the Expo Google Fonts packages: Bricolage Grotesque, DM Sans, Nunito.

Three tab screens: Getting there, Stage finder, Wear and bring. All three share one SQLite database. Stage finder writes sets to a plan table, Getting there reads and replans that plan, and Wear and bring reads the forecast and packing list. A replan can change the forecast and packing list too.

Do not write code yet. Give me a short plan with the folder structure, the SQLite tables you would create, how the screens share data, and the order of work. Wait for my approval.
```

## Prompt 2: setup, theme and database [done]
(Already run. See the earlier version if you need it.)

## Prompt 3: Stage finder, first version [done]
(Already run. Prompt 9 below upgrades it.)

## Prompt 4: Getting there with replans [done]
(Already run. Prompt 8 below rebuilds this screen as the Lineup page and removes the commute timeline and the replan UI from it.)

## Prompt 7: web, phone layout, theme, demo location [done]
(Already run. We are building for the simulator now.)

## Prompt 9: Stage finder map (new task)

```
Read cue-bob-prompts-v3.md. Follow the Rules for every task section and Prompt 9 only. Edit only the Stage finder screen file, new files for the map, and the shared data you need. Do not change the other screens. Everything stays local, no API keys. No live map and no web only features.

Rebuild the Stage finder map from assets/cue-map-data.json and the reference drawing assets/cue-festival-map-v3.svg, using react native svg so everything is tappable. Draw the blocks, streets, street name labels, trees, the entrance tag, the VIP entry tags, the 13 numbered stage pins and the amenity icons from the JSON. Match the look of the reference. Keep the existing routing function and extend it so it works from any start to any stage or amenity.
- Under the map add the legend as chips, one per amenity type. Tapping a chip shows or hides that type on the map.
- Tapping a stage shows the card with its name and the sample acts at that stage from the sets table, but only Saturday acts (Saturday is the sample festival day). Show a route from the start point drawn along the streets with a simulated walking time, and the Add to my plan button with the overlap warning you already have.
- Add a Find nearest button on each amenity chip. It finds the nearest icon of that type from the start point along the streets, highlights it and shows a simulated walking time.
- The start point defaults to the entrance. Keep the Pick start button.
- Keep the small note that the map is illustrative and not to scale.
- Skip the search box unless it takes only a few lines.
Mobile first: the map fills the width, the chips scroll sideways and tap targets are at least 44 pixels.
```

## Prompt 10: Discover (new task)

```
Read cue-bob-prompts-v3.md. Follow the Rules for every task section and Prompt 10 only. Edit only the my-lineup.jsx screen file (this is now the Discover screen), new files it needs (put the artist card in components/ArtistCard.jsx so another screen can reuse it), the database setup for the new tables, and the Discover tab title in the tab layout if Prompt 0 has not already renamed it. Do not change the other screens' files. If the new data breaks something on another screen, tell me instead of fixing it. Show the migration plan once and wait for my go. Everything stays local, no API keys, no audio, no photos. Use the fonts and styles from the theme, nothing under 12 pixels.

Data. Use assets/cue-sample-lineup.csv. Show me a migration plan first. Use the existing sets table: add the columns genre, subgenre, bio and day if they are missing, replace the old Sample Act rows with the 34 rows from the CSV, and keep plan_items working. Add tables for taste_picks (subgenre), swipes (act_id and action like or skip) and saved_acts (act_id). All stored only on this device. Add a Clear my taste button that empties them.
Migration rules: keep set ids 1 to 34 matching the CSV ids. Check whether plan_items stores set ids or copies of set data and tell me which. Since the old sets disappear, also clear plan_items and replan_log back to the starting state and tell me what you cleared. Check the time format the existing code uses and convert the CSV times to match, or make sure everything handles 24 hour HH:MM. Use a lineup_version value in the settings table to decide whether to reseed, not a check on the first row. Saturday is the sample festival day: Stage finder's Add to plan works for Saturday acts only. Friday acts can be liked and saved but show the note "Plan covers Saturday in this demo." After the migration, confirm Stage finder still loads. Do not edit stage-finder.jsx.

Screen. A small segmented control at the top: Discover | Matches. Mobile first for a 390 pixel wide screen. Keep it light: lots of space, little text.

1. Discover. The top part shows the 8 genres as soft glowing bubbles as described in the Look and feel section (react native svg RadialGradient, soft edges, loose staggered layout, sized by number of acts, genre colors from the Look and feel list). Genre bubbles show only the name. Tapping a genre animates it growing and blooming into its subgenre bubbles with the act count on each, and the other genres fade out. Tapping a subgenre selects it (bolder label and a small ink dot). A small Back link returns to the genres. Each bubble has a tap area of at least 56 pixels. Use the built in Animated API. Once at least one subgenre is picked, show one act card under the bubbles, with Like and Skip buttons. The card has a colored initials tile, the name, a genre chip and a subgenre chip side by side, the stage and day and time on one line, and a two line bio from the sets table (cut off after two lines). Keep the buttons on the same card. Tapping the name opens the artist card. The cards come from up to 8 acts, mostly matching the picks plus a few outside them. Likes and skips are saved in swipes. A Like also saves the act to saved_acts. Refresh the card stack when the picks change. No swipe gestures. Add a small See my matches link that switches to Matches.

2. Matches. Rank the acts with the scoring rules in the Sample lineup and taste rules section. Each row shows the initials tile, name, genre chip, stage, day, time, a short why line and a heart to save to saved_acts. Add the label "Simple rules, not AI".

3. Artist card (components/ArtistCard.jsx, shown as a bottom sheet or modal). Initials tile, name, genre and subgenre, stage, day and time, and the bio. A line saying this is a sample act invented for the demo. A Find on map button that opens Stage finder with that stage selected (pass it through the settings table or the router, whichever is simpler).

Label the matches and acts as sample. There is no Timeline view here anymore. Saved acts are shown on the Lineup page.
```

## Prompt 8: Lineup page (new task, run after Prompt 10)

```
Read cue-bob-prompts-v3.md. Follow the Rules for every task section and Prompt 8 only. Edit only the index.jsx screen file (the Lineup page) and new small files it needs, such as components/ScheduleTimeline.jsx. Do not change the other screens, the replan code or the database tables. Ask for my approval before you change anything.

Rebuild the Lineup page as described in the Lineup part of What each screen does, using the Look and feel section:
1. Header: title Lineup, and on the right side of the same row a small pale yellow Sample day pill followed by a round yellow outlined directions button (right aligned, vertically centered with the title, 10 pixels apart) with the Ionicons navigate icon (not a map pin, because the Map tab already uses a map icon, and never a Google logo). Tapping it opens Google Maps directly.
2. Day tabs Friday and Saturday in big Display type, Saturday selected, with a pink underline under the selected one. Below them the segmented control Timeline | Saved | All acts.
3. Timeline view: use the sets table for the selected day. Columns by stage, only for stages that have acts that day, scrolling sideways with about one and a half columns visible. A time axis from 17:00 to 24:00 down the left, one hour about 76 pixels tall. Each act is an outlined block placed by its start and end time, with a colored initials tile, the name, a Nunito line with genre and time, and a heart. Saved acts (in saved_acts, or plan_items if those hold set ids) are filled blue or pink. Tapping a heart saves or unsaves the act in saved_acts. Tapping the name opens the artist card from components/ArtistCard.jsx. Friday acts can be saved. Act blocks must be roomy: about 205 pixels wide so one column fits with a peek of the next, at least one hour tall (about 76 pixels), tile 40, name in Display 16 to 17 that wraps to two lines and is never cut off or squeezed, then one line with the genre and the start time in Nunito 13, and the heart in the bottom right corner so it never covers the name. If a set is shorter than an hour, the block is still at least 64 pixels tall. Do not write to plan_items from here.
4. Saved view: only the saved acts for the selected day, as outlined cards in time order, each with a one line bio under the name, merged from saved_acts and plan_items by set id with no duplicates (if plan_items stores copies instead of set ids, tell me before merging). Show a pale yellow overlap chip when two saved acts overlap. If the list is empty, show a friendly empty state with a button to Discover.
5. All acts view: every act that day sorted by start time, each row with the initials tile, name, genre, stage, time and a heart.
6. Directions: the navigate button is a plain link. Tapping it calls Linking.openURL with the Google Maps directions link to the festival entrance (2217 NW 5th Ave, Miami, FL) from the Google Maps links section. When Demo location is ON, add origin=Wynwood%2C%20Miami%2C%20FL. When it is OFF, leave out the origin so Google Maps uses the real location. Do not add a travel mode, a picker, a text field or a sheet. Put the existing Demo location switch in a small row at the very bottom of the page, below the list.
7. Remove from this screen the commute timeline, the transit status badge, the Replan button, the replan history, and Reset demo if it is only there for replans. Do not delete the replan code, helper files or any table. Just stop showing them.
Mobile first for a 390 pixel wide screen. Use the shared theme styles. Add notes to BOB_LOG.md.
```

## Prompt 5: Wear and bring with hashtags (new task)

```
Read cue-bob-prompts-v3.md. Follow the Rules for every task section and Prompt 5 only. Build only the Wear and bring screen, in its own file. Do not change the other screens except to read and write shared data in the database. Ask for my approval before you change anything.

Show a forecast card from the forecast table, labeled simulated, and a what to wear suggestion based on it. Show a packing checklist from packing_items where I can tap items to check them off, saved in the database. Show a leave at home list. When the forecast changes after a replan, show the new suggestion and the new packing items.

Attendee Picks. Show it as a dropdown (accordion) card: a row with the title Attendee Picks, a count chip with the number of posts and a chevron, collapsed by default and tapping the row expands or collapses it. When expanded it shows the filter chips, the hashtag chips and the feed, with the first 4 posts and a Show more button that reveals the rest. List the rows from the tips table. Each tip is one or two lines with no names and no ratings. Tips that have a source show it as a tappable link. Tips without a source show a Sample or General tip label. Each tip has an Add to my list button that adds a matching item to my packing list.

Hashtags. Add a tags column to the tips table. Show each tip's tags as hashtag chips. Tapping a chip filters the list to that tag, and tapping it again clears the filter. Show a row of the most used tags under the filter chips. Add tags to the 6 existing tips: wristband tip #wristband #lines; rain tip #rain #weather; entrance tip #entrance #lines; attendance tip #crowds #lines; re entry tip #entrance #rules; charger tip #battery #packlight.
Also seed these 6 sample tips, written for this demo, each labeled Sample with no source link:
1. "Comfy shoes win. You will walk way more than you think between stages." #shoes #walking
2. "Pick a meetup spot with your group before the biggest crowds build." #meetup #crowds
3. "A cheap clear poncho beats an umbrella in a packed crowd." #rain #packlight
4. "Fill your bottle at the water stations instead of buying more." #water #hydration
5. "Screenshot your ticket and your plan in case the signal drops." #phone #signal
6. "Bring earplugs. Your ears will thank you near the front." #earplugs #hearing
Posts. Add a type column to the tips table with the values tip, fit and review (existing rows are tip). Show filter chips above the feed: All, Fits, Reviews, Tips, next to the hashtag chips. Seed these sample posts, written for this demo, each labeled Sample with no names, no ratings and no source link:
Fits. Each shows an outlined card with a colored tile with the Ionicons shirt icon (no photos), a title, the pieces, hashtags and an Add to my list button.
1. "Breezy and light": linen shirt, cargo shorts, white sneakers. #sunny #cargo
2. "Night owl layers": black tee, light jacket, cargo pants. #night #layers
3. "Rain ready": clear poncho, quick dry shorts, waterproof sandals. #rain #poncho
4. "Dance floor comfort": tank top, bike shorts, broken in sneakers. #shoes #dancing
Reviews. Each shows a short written take, a verdict chip (Worth it, Mixed or Skip it) and hashtags.
1. "Water refill stations were easy to find and the lines moved fast." Worth it. #water #lines
2. "Food lines got long at peak hours. Eat before the headliners start." Mixed. #food #lines
3. "The shaded rest area near the back was a lifesaver in the afternoon." Worth it. #shade #rest
The feed is seeded sample data. It does not pull from Reddit, Instagram, TikTok, X or any other site, because the lab rules do not allow data obtained from social media. Show a small note under Attendee Picks: "Sample posts written for this demo."
Add an Add your own tip box where I type a short tip and any hashtags. It saves to the tips table labeled My tip and lives only on this device. Do not fetch anything from Instagram, X, TikTok or any social platform, and show a note that the sample tips are written for this demo and not collected from social media.

Make the packing checklist the one place for my own items: put a round plus button (white, 1.5 pixel ink outline, 44 pixels) at the right of the Packing list heading. Tapping it shows an outlined text field with an Add pill button right under the heading. Added items are saved in packing_items on this device, appear in the list with a small Mine chip, can be checked off, and can be removed with a small x (only items I added). Do not build a separate My list section. Items added from Attendee Picks go into this same list. Show a note that the sourced tips come from public news coverage, not from individual posts. Show a Last updated date at the top of the tips list, read from the database, and add a last_updated column to the tips table if it isn't there. Use today's date for the seeded tips.
Mobile first for a 390 pixel wide screen.
```

## Prompt 6: connect and polish (new task, run last)

```
Read cue-bob-prompts-v3.md. Follow the Rules for every task section and Prompt 6 only. Check that the four screens work together in the simulator. Tell me what you find before you fix anything.
- Like an act in Discover (a Saturday act), then confirm it shows up in Saved on Lineup.
- Add a set from Stage finder, then confirm it shows up in Saved on Lineup.
- Pick bubbles and like a few cards, then confirm Matches updates.
- Tap Find on map from an artist card and confirm Stage finder opens on that stage.
- On Lineup, tap the navigate button with Demo location ON and OFF and confirm Google Maps opens with the right start and the festival entrance as the destination. Switch between Timeline, Saved and All acts and between Friday and Saturday. Confirm there is no commute timeline or Replan button left.
- On Map, switch between Illustrated and Satellite and back, and tap a stage on each.
- Switch Demo location on and off and confirm nothing crashes.
Then apply the colors, fonts, text sizes (nothing under 12), outlines and button sizes consistently across all four screens, make sure every simulated or sample item is labeled, and update the README with how to run the app in the simulator, a short list of features, and the data sources and attributions (the map drawing and the sample acts are Cue's own).
```

## Prompt 11: festival persona card (stretch, only if time and coins are left)

```
Read cue-bob-prompts-v3.md. Follow the Rules for every task section and Prompt 11 only. Edit only the my-lineup.jsx screen file (Discover). On the Matches view, add a Your festival persona card at the top. Rules: Wanderer if the person picked subgenres in 4 or more genres, Purist if in only 1 genre, Mixer otherwise. Each persona has a name, a one sentence friendly description and a small colored badge. It updates when the picks change. Label it Sample, simple rules, not AI. Do not save, share or send it anywhere.
```

## Prompt 12: satellite view on the Map tab (new task, run after Prompt 5)

```
Read cue-bob-prompts-v3.md. Follow the Rules for every task section and Prompt 12 only. Edit only the Stage finder screen file and one small new file for the satellite view. Ask me before installing react-native-maps (use the version that matches this Expo SDK, through npx expo install). Do not change the illustrated map, its routing or any other screen.

Goal: show that the app can run on real map data. The festival has already happened and stages are temporary, so the imagery will show the empty site. That is fine.

1. Add a segmented control at the top of Stage finder: Illustrated | Satellite. Illustrated is the default and works exactly as before.
2. Satellite shows a react-native-maps MapView with mapType "satellite" (or "hybrid" if labels help), using the default iOS provider so no API key is needed. Put the venue center in one constant, VENUE_CENTER, in the new file, set to latitude 25.7990 and longitude -80.2022, and zoom so the neighborhood and the venue block fill the screen. I will adjust the constant by eye, so keep it easy to find, and tell me its value when you finish.
3. Add sample markers: the entrance and the 13 stage pins, placed with the geo conversion in assets/cue-map-data.json (schematic_center_xy, meters_per_map_unit, the formulas and the orientation note), using VENUE_CENTER as the center. Markers use the same numbered pin look as the illustrated map. Tapping a stage marker shows the same stage card as the illustrated map.
4. Show the label "Pin positions are illustrative" on the satellite view. Do not draw walking routes on it.
5. If the map library fails to load in the simulator, give me the exact error and stop. Do not switch approach.
Add a note to BOB_LOG.md.
```
