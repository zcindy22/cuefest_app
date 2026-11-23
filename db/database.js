/**
 * db/database.js
 * Opens the SQLite database, creates tables, and seeds sample data.
 * All data is simulated / sample only.
 */

import * as SQLite from 'expo-sqlite';
import graniteTips from '../assets/granite-tips.json';

let db = null;
// Holds the in-flight init promise so concurrent callers share one open.
let initPromise = null;

export function getDb() {
  return db;
}

export async function initDatabase() {
  if (initPromise) return initPromise;
  initPromise = _doInit();
  return initPromise;
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  initPromise = null;
}

// Retries up to maxAttempts times with an exponential back-off.
// expo-sqlite resets its internal vfsPromise after a failed
// createSyncAccessHandle, so the next call to openDatabaseAsync will
// succeed once the previous worker's OPFS handle is released.
async function _doInit(attempt = 1) {
  const maxAttempts = 5;
  console.log(`[db] _doInit attempt=${attempt}`);
  if (!db) {
    try {
      console.log('[db] calling openDatabaseAsync');
      db = await SQLite.openDatabaseAsync('cue.db');
      console.log('[db] openDatabaseAsync resolved');
    } catch (err) {
      console.error('[db] openDatabaseAsync failed', err);
      if (attempt < maxAttempts && String(err).includes('createSyncAccessHandle')) {
        // Reset so the next invocation triggers a fresh open attempt.
        initPromise = null;
        const delay = attempt * 300;
        await new Promise((r) => setTimeout(r, delay));
        return initDatabase();
      }
      throw err;
    }
  }
  console.log('[db] running execSync / seeding');
  const database = db;

  // Create / migrate tables
  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY,
      stage_id INTEGER NOT NULL,
      act_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      genre TEXT,
      subgenre TEXT,
      bio TEXT,
      day TEXT
    );

    CREATE TABLE IF NOT EXISTS plan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL,
      leave_home TEXT,
      transit_minutes INTEGER,
      arrive_time TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      stage_name TEXT,
      act_name TEXT,
      is_original INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS replan_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      replan_number INTEGER NOT NULL,
      reason TEXT NOT NULL,
      what_changed TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forecast (
      id INTEGER PRIMARY KEY,
      condition TEXT NOT NULL,
      temp_f REAL NOT NULL,
      rain_chance INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS packing_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      is_user_item INTEGER DEFAULT 0,
      source TEXT
    );

    CREATE TABLE IF NOT EXISTS tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tip_text TEXT NOT NULL,
      source_name TEXT,
      source_url TEXT,
      is_general INTEGER DEFAULT 0,
      last_updated TEXT,
      type TEXT DEFAULT 'tip',
      tags TEXT DEFAULT ''
    );

    -- Tracks replan state and anchor times for the demo
    CREATE TABLE IF NOT EXISTS replan_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      replans_used INTEGER DEFAULT 0,
      leave_home TEXT DEFAULT '17:00',
      transit_time TEXT DEFAULT '17:20',
      arrive_time TEXT DEFAULT '18:25',
      transit_status TEXT DEFAULT 'on_time'
    );

    -- App settings (key/value pairs)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Taste / lineup tables
    CREATE TABLE IF NOT EXISTS taste_picks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subgenre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS swipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      act_id INTEGER NOT NULL,
      action TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_acts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      act_id INTEGER NOT NULL UNIQUE
    );
  `);

  // ── Add new columns to sets if upgrading from old schema ─────────────────
  // SQLite ALTER TABLE ADD COLUMN is safe to run if column already exists — it
  // throws an error, so we catch individually.
  const setsInfo = database.getAllSync('PRAGMA table_info(sets)');
  const setsCols = setsInfo.map(r => r.name);
  if (!setsCols.includes('genre')) {
    database.execSync('ALTER TABLE sets ADD COLUMN genre TEXT');
  }
  if (!setsCols.includes('subgenre')) {
    database.execSync('ALTER TABLE sets ADD COLUMN subgenre TEXT');
  }
  if (!setsCols.includes('bio')) {
    database.execSync('ALTER TABLE sets ADD COLUMN bio TEXT');
  }
  if (!setsCols.includes('day')) {
    database.execSync('ALTER TABLE sets ADD COLUMN day TEXT');
  }

  // ── Seed stages (only if empty) ──────────────────────────────────────────
  const stageCount = database.getFirstSync('SELECT COUNT(*) AS n FROM stages');
  if (stageCount.n === 0) {
    const stages = [
      { id: 1,  name: 'Stage 1',  x: 435, y: 560 },
      { id: 2,  name: 'Stage 2',  x: 200, y: 640 },
      { id: 3,  name: 'Stage 3',  x: 150, y: 520 },
      { id: 4,  name: 'Stage 4',  x: 230, y: 460 },
      { id: 5,  name: 'Stage 5',  x:  85, y: 500 },
      { id: 6,  name: 'Stage 6',  x: 220, y: 260 },
      { id: 7,  name: 'Stage 7',  x: 420, y: 130 },
      { id: 8,  name: 'Stage 8',  x: 400, y: 220 },
      { id: 9,  name: 'Stage 9',  x: 480, y: 280 },
      { id: 10, name: 'Stage 10', x: 560, y: 230 },
      { id: 11, name: 'Stage 11', x: 590, y: 140 },
      { id: 12, name: 'Stage 12', x: 650, y: 520 },
      { id: 13, name: 'Stage 13', x: 680, y: 640 },
    ];
    const stageStmt = database.prepareSync(
      'INSERT INTO stages (id, name, x, y) VALUES (?, ?, ?, ?)'
    );
    for (const s of stages) {
      stageStmt.executeSync([s.id, s.name, s.x, s.y]);
    }
    stageStmt.finalizeSync();
  }

  // ── Seed sets from CSV data (version-gated) ──────────────────────────────
  // lineup_version = '1' means the 34-act CSV seed has been applied.
  // On first run or upgrade from old generic seed:
  //   1. Clear plan_items (copied act data tied to old set ids)
  //   2. Clear replan_log
  //   3. Reset replan_state to demo start
  //   4. Delete all old sets and insert the 34 CSV rows with IDs 1–34
  //   5. Mark settings.lineup_version = '1'
  const lineupVersion = database.getFirstSync(
    "SELECT value FROM settings WHERE key = 'lineup_version'"
  );
  if (!lineupVersion || lineupVersion.value !== '1') {
    // ── What is being cleared ──────────────────────────────────────────────
    // plan_items:   all rows (act copies tied to old set ids 1–39)
    // replan_log:   all rows (replan history tied to the old plan)
    // replan_state: reset to replans_used=0, original anchor times, on_time
    // sets:         all 39 old generic "Sample Act N-M" rows replaced with 34 CSV rows
    database.execSync(`
      DELETE FROM plan_items;
      DELETE FROM replan_log;
      DELETE FROM sets;
      UPDATE replan_state
        SET replans_used   = 0,
            leave_home     = '17:00',
            transit_time   = '17:20',
            arrive_time    = '18:25',
            transit_status = 'on_time'
        WHERE id = 1;
    `);

    // Insert 34 acts from cue-sample-lineup.csv, IDs match CSV ids 1–34
    // Times are already HH:MM 24-hour — no conversion needed
    const setStmt = database.prepareSync(
      `INSERT INTO sets (id, stage_id, act_name, start_time, end_time, genre, subgenre, bio, day)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const CSV_ACTS = [
      [1,  1,  'Solstice Parade',       '18:30','19:45','Dance',   'House',       'Sunset house with live percussion and a big singalong finish.',              'Fri'],
      [2,  1,  'Kora Nightfall',        '20:00','21:15','Dance',   'Disco',       'Glittery disco edits built for a packed main stage.',                        'Fri'],
      [3,  2,  'DJ Paper Moon',         '19:00','20:30','Dance',   'Tech house',  'Rolling tech house with deep basslines and tight transitions.',              'Fri'],
      [4,  2,  'Saffron Static',        '21:00','22:30','Dance',   'House',       'Warm, groovy house that keeps the dance floor moving.',                     'Fri'],
      [5,  3,  'Halcyon Drift',         '20:00','21:30','Techno',  'Melodic',     'Dreamy melodic techno with slow building synth layers.',                    'Fri'],
      [6,  3,  'Acid Lantern',          '22:00','23:30','Techno',  'Acid',        'Squelchy acid lines and hard hitting late night energy.',                   'Fri'],
      [7,  4,  'Ruin Cathedral',        '21:30','23:00','Techno',  'Peak time',   'Driving peak time techno made for the loudest hour of the night.',          'Fri'],
      [8,  5,  'Tidewave Collective',   '19:30','21:00','Bass',    'Drum and bass','Fast breakbeats, rolling basslines and a lot of crowd energy.',            'Fri'],
      [9,  6,  'Mira Solano',           '18:00','19:15','Latin',   'Reggaeton',   'Bright reggaeton with big hooks and a dance party feel.',                   'Fri'],
      [10, 7,  'Cobalt Weather',        '19:00','20:15','Indie',   'Indie dance', 'Guitar and synth indie dance that is easy to sing and move to.',            'Fri'],
      [11, 8,  'Lune Atlas',            '20:30','21:45','Alt R&B', 'Neo soul',    'Smooth neo soul with jazzy chords and a late evening glow.',               'Fri'],
      [12, 8,  'Velour Hours',          '22:00','23:00','Alt R&B', 'Dark R&B',    'Moody, slow burning R&B with heavy low end.',                              'Fri'],
      [13, 9,  'Grit Machine',          '22:00','23:15','Bass',    'Dubstep',     'Heavy dubstep with big drops and a lot of bass.',                           'Fri'],
      [14, 10, 'Neon Anchor',           '20:00','21:15','Electro', 'Synthwave',   'Retro synthwave with cinematic leads and steady drive.',                    'Fri'],
      [15, 11, 'Ode to Pavement',       '19:30','20:45','Hip hop', 'Boom bap',    'Classic boom bap beats with sharp rhymes and live scratching.',             'Fri'],
      [16, 12, 'Rumba Electrica',       '21:00','22:15','Latin',   'Dembow',      'Fast dembow rhythms mixed with electronic percussion.',                     'Fri'],
      [17, 13, 'Plastic Garden',        '18:30','19:45','Indie',   'Dream pop',   'Hazy dream pop with soft vocals and shimmering guitars.',                   'Fri'],
      [18, 1,  'Golden Hour Syndicate', '19:00','20:30','Dance',   'House',       'Feel good house built around vocals, piano and sunshine.',                  'Sat'],
      [19, 1,  'Mono Palace',           '21:30','23:00','Dance',   'Tech house',  'Punchy tech house with a late night club sound.',                           'Sat'],
      [20, 2,  'Juno Vega',             '18:30','19:45','Latin',   'Latin house', 'Latin house with percussion, brass and a summer vibe.',                     'Sat'],
      [21, 3,  'The Midnight Fold',     '19:00','20:15','Indie',   'Indie rock',  'Loud, melodic indie rock with big choruses.',                               'Sat'],
      [22, 4,  'Breaker Saints',        '20:00','21:15','Electro', 'Breaks',      'Choppy breakbeats and electro basslines with lots of swagger.',             'Sat'],
      [23, 4,  'Hollow Meridian',       '22:00','23:30','Bass',    'Drum and bass','Dark, fast drum and bass for the late crowd.',                             'Sat'],
      [24, 5,  'Static Orchard',        '21:00','22:30','Techno',  'Melodic',     'Atmospheric melodic techno with slow rising tension.',                      'Sat'],
      [25, 6,  'Low Tide Choir',        '20:00','21:00','Alt R&B', 'Lo fi soul',  'Dusty, lo fi soul with layered vocals and mellow beats.',                  'Sat'],
      [26, 6,  'Bloom Season',          '22:00','23:15','Dance',   'House',       'Uplifting house with garden party warmth.',                                  'Sat'],
      [27, 7,  'Vanta Bloom',           '22:00','23:30','Techno',  'Peak time',   'Relentless peak time techno with a dark, hypnotic pulse.',                 'Sat'],
      [28, 8,  'Prism Kids',            '19:30','20:45','Electro', 'Electro pop', 'Glossy electro pop with bright hooks and neon energy.',                    'Sat'],
      [29, 9,  'Pulse Cartel',          '20:30','21:45','Bass',    'Garage',      'Skippy UK style garage with deep sub bass.',                               'Sat'],
      [30, 9,  'Tangerine Static',      '22:15','23:30','Bass',    'Dubstep',     'Wobbly dubstep with playful sound design and huge drops.',                 'Sat'],
      [31, 10, 'Ember Quarter',         '19:30','20:45','Hip hop', 'Rap',         'Sharp lyrical rap over minimal beats.',                                     'Sat'],
      [32, 11, 'Cielo Rojo',            '20:00','21:15','Latin',   'Reggaeton',   'Smooth reggaeton with romantic hooks and a big dance break.',               'Sat'],
      [33, 12, 'Frostbite Disco',       '21:30','23:00','Dance',   'Disco',       'Cool disco with funky bass and bright strings.',                            'Sat'],
      [34, 13, 'Sidewalk Oracle',       '20:45','22:00','Hip hop', 'Trap',        'Heavy trap beats with a rowdy crowd call and response.',                   'Sat'],
    ];
    for (const row of CSV_ACTS) {
      setStmt.executeSync(row);
    }
    setStmt.finalizeSync();

    // Mark migration done
    database.runSync(
      `INSERT INTO settings (key, value) VALUES ('lineup_version', '1')
       ON CONFLICT(key) DO UPDATE SET value = '1'`
    );
  }

  // ── Seed forecast (only if empty) ────────────────────────────────────────
  const forecastCount = database.getFirstSync('SELECT COUNT(*) AS n FROM forecast');
  if (forecastCount.n === 0) {
    database.runSync(
      'INSERT INTO forecast (id, condition, temp_f, rain_chance) VALUES (1, ?, ?, ?)',
      ['Partly Cloudy', 78, 20]
    );
  }

  // ── Seed packing items (only if empty) ───────────────────────────────────
  const packCount = database.getFirstSync('SELECT COUNT(*) AS n FROM packing_items');
  if (packCount.n === 0) {
    const defaultItems = [
      'Phone + charger',
      'Portable battery pack',
      'Valid ID',
      'Cash and card',
      'Comfortable shoes',
      'Sunscreen',
      'Water bottle',
      'Ear plugs',
      'Light layer / jacket',
    ];
    const packStmt = database.prepareSync(
      'INSERT INTO packing_items (label, checked, is_user_item) VALUES (?, 0, 0)'
    );
    for (const item of defaultItems) {
      packStmt.executeSync([item]);
    }
    packStmt.finalizeSync();
  }

  // ── Migrate tips table: add type and tags columns if missing ─────────────
  const tipsInfo = database.getAllSync('PRAGMA table_info(tips)');
  const tipsCols = tipsInfo.map(r => r.name);
  if (!tipsCols.includes('type')) {
    database.execSync("ALTER TABLE tips ADD COLUMN type TEXT DEFAULT 'tip'");
  }
  if (!tipsCols.includes('tags')) {
    database.execSync("ALTER TABLE tips ADD COLUMN tags TEXT DEFAULT ''");
  }

  // ── Seed tips (version-gated: tips_version = '2') ─────────────────────────
  const tipsVersion = database.getFirstSync(
    "SELECT value FROM settings WHERE key = 'tips_version'"
  );
  // Changes whenever the Granite file is regenerated, so the tips reseed.
  const TIPS_VERSION = '3-' + (graniteTips.generated_at || 'none');
  if (!tipsVersion || tipsVersion.value !== TIPS_VERSION) {
    database.execSync('DELETE FROM tips');
    const today = new Date().toISOString().slice(0, 10);
    const TIPS_DATA = [
      // ── Sourced tips (from public news coverage) ──
      { tip_text: 'Wristband pickup was slow on Friday night, so use a digital pass if offered and arrive early.', source_name: 'BizBash', source_url: 'https://www.bizbash.com', is_general: 0, type: 'tip', tags: '#wristband #lines' },
      { tip_text: 'Heavy rain and a midnight storm pushed thousands indoors, so bring a rain jacket or poncho and expect weather pauses.', source_name: 'BizBash', source_url: 'https://www.bizbash.com', is_general: 0, type: 'tip', tags: '#rain #weather' },
      { tip_text: 'The main entrance got congested, so allow extra time to get in.', source_name: 'BizBash', source_url: 'https://www.bizbash.com', is_general: 0, type: 'tip', tags: '#entrance #lines' },
      { tip_text: 'Attendance hit about 80,000, so expect lines and pick a meetup spot with your group.', source_name: 'BizBash', source_url: 'https://www.bizbash.com', is_general: 0, type: 'tip', tags: '#crowds #lines' },
      { tip_text: 'In and out re-entry is not allowed according to the festival FAQ, so bring what you need before you go in.', source_name: 'III Points FAQ', source_url: 'https://iiipoints.com', is_general: 0, type: 'tip', tags: '#entrance #rules' },
      { tip_text: 'Bring a portable charger.', source_name: null, source_url: null, is_general: 1, type: 'tip', tags: '#battery #packlight' },
      // ── Sample tips ──
      { tip_text: 'Comfy shoes win. You will walk way more than you think between stages.', source_name: null, source_url: null, is_general: 1, type: 'tip', tags: '#shoes #walking' },
      { tip_text: 'Fill your bottle at the water stations instead of buying more.', source_name: null, source_url: null, is_general: 1, type: 'tip', tags: '#water #hydration' },
      // ── Sample fits (title|pieces encoded in tip_text) ──
      { tip_text: 'Breezy and light|linen shirt, cargo shorts, white sneakers', source_name: null, source_url: null, is_general: 1, type: 'fit', tags: '#sunny #cargo' },
      { tip_text: 'Rain ready|clear poncho, quick dry shorts, waterproof sandals', source_name: null, source_url: null, is_general: 1, type: 'fit', tags: '#rain #poncho' },
      // ── Sample reviews (text|verdict encoded in tip_text) ──
      { tip_text: 'Water refill stations were easy to find and the lines moved fast.|Worth it', source_name: null, source_url: null, is_general: 1, type: 'review', tags: '#water #lines' },
      { tip_text: 'The shaded rest area near the back was a lifesaver in the afternoon.|Worth it', source_name: null, source_url: null, is_general: 1, type: 'review', tags: '#shade #rest' },
    ];
    // ── Tips drafted by IBM Granite on watsonx.ai from public coverage ──
    // Generated offline by scripts/granite_tips.mjs and saved in assets/granite-tips.json,
    // so the app itself needs no API key. Empty until the script has been run.
    if ((graniteTips.tips || []).length > 0) {
      // Granite wrote tips from the same public coverage, so drop the hand written copies.
      for (let i = TIPS_DATA.length - 1; i >= 0; i--) {
        if (TIPS_DATA[i].source_name === 'BizBash' || TIPS_DATA[i].source_name === 'III Points FAQ') TIPS_DATA.splice(i, 1);
      }
    }
    for (const g of (graniteTips.tips || [])) {
      TIPS_DATA.push({ tip_text: g.tip, source_name: 'IBM Granite on watsonx.ai, from public coverage', source_url: 'https://www.ibm.com/granite', is_general: 0, type: 'tip', tags: g.tags });
    }
    const tipStmt = database.prepareSync(
      'INSERT INTO tips (tip_text, source_name, source_url, is_general, type, tags, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const t of TIPS_DATA) {
      tipStmt.executeSync([t.tip_text, t.source_name, t.source_url, t.is_general, t.type, t.tags, today]);
    }
    tipStmt.finalizeSync();
        database.runSync(
      `INSERT INTO settings (key, value) VALUES ('tips_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [TIPS_VERSION]
    );
  }

  // ── Seed replan_state (only if empty) ────────────────────────────────────
  const rsCount = database.getFirstSync('SELECT COUNT(*) AS n FROM replan_state');
  if (rsCount.n === 0) {
    database.runSync(
      `INSERT INTO replan_state (id, replans_used, leave_home, transit_time, arrive_time, transit_status)
       VALUES (1, 0, '17:00', '17:20', '18:25', 'on_time')`
    );
  }

  // ── Seed settings (only if empty) ────────────────────────────────────────
  const settingsCount = database.getFirstSync('SELECT COUNT(*) AS n FROM settings');
  if (settingsCount.n === 0) {
    database.runSync(
      `INSERT INTO settings (key, value) VALUES ('demo_location', 'on')`
    );
  }
}
