/**
 * db/database.js
 * Opens the SQLite database, creates tables, and seeds sample data.
 * All data is simulated / sample only.
 */

import * as SQLite from 'expo-sqlite';

let db = null;

export function getDb() {
  return db;
}

export async function initDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('cue.db');
  }
  const database = db;

  // Create tables
  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      act_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
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
      last_updated TEXT
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
  `);

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

  // ── Seed sets (only if empty) ────────────────────────────────────────────
  const setCount = database.getFirstSync('SELECT COUNT(*) AS n FROM sets');
  if (setCount.n === 0) {
    // 3 sample acts per stage, staggered across a festival day (6 PM – 2 AM)
    const slots = [
      ['18:00', '18:45'],
      ['19:30', '20:15'],
      ['21:00', '22:00'],
    ];
    const setStmt = database.prepareSync(
      'INSERT INTO sets (stage_id, act_name, start_time, end_time) VALUES (?, ?, ?, ?)'
    );
    for (let stageId = 1; stageId <= 13; stageId++) {
      slots.forEach(([start, end], i) => {
        setStmt.executeSync([stageId, `Sample Act ${stageId}-${i + 1}`, start, end]);
      });
    }
    setStmt.finalizeSync();
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

  // ── Seed tips (only if empty) ────────────────────────────────────────────
  const tipCount = database.getFirstSync('SELECT COUNT(*) AS n FROM tips');
  if (tipCount.n === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const tips = [
      {
        tip_text:
          'Wristband pickup was slow on Friday night, so use a digital pass if offered and arrive early.',
        source_name: 'BizBash',
        source_url: 'https://www.bizbash.com',
        is_general: 0,
      },
      {
        tip_text:
          'Heavy rain and a midnight storm pushed thousands indoors, so bring a rain jacket or poncho and expect weather pauses.',
        source_name: 'BizBash',
        source_url: 'https://www.bizbash.com',
        is_general: 0,
      },
      {
        tip_text:
          'The main entrance got congested, so allow extra time to get in.',
        source_name: 'BizBash',
        source_url: 'https://www.bizbash.com',
        is_general: 0,
      },
      {
        tip_text:
          'Attendance hit about 80,000, so expect lines and pick a meetup spot with your group.',
        source_name: 'BizBash',
        source_url: 'https://www.bizbash.com',
        is_general: 0,
      },
      {
        tip_text:
          'In and out re-entry is not allowed according to the festival FAQ, so bring what you need before you go in.',
        source_name: 'III Points FAQ',
        source_url: 'https://iiipoints.com',
        is_general: 0,
      },
      {
        tip_text: 'Bring a portable charger.',
        source_name: null,
        source_url: null,
        is_general: 1,
      },
    ];
    const tipStmt = database.prepareSync(
      'INSERT INTO tips (tip_text, source_name, source_url, is_general, last_updated) VALUES (?, ?, ?, ?, ?)'
    );
    for (const t of tips) {
      tipStmt.executeSync([t.tip_text, t.source_name, t.source_url, t.is_general, today]);
    }
    tipStmt.finalizeSync();
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
