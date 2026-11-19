/**
 * lib/replan.js
 *
 * Scripted replan logic for the Cue demo.
 *
 * All three disruptions live in one exported function: runReplan(replanNumber, db).
 * To swap in an AI model later, replace the body of runReplan() while keeping
 * the same signature and return shape.
 *
 * Returns: { reason, what_changed, newState }
 *   reason        – short cause label
 *   what_changed  – human-readable sentence for the card
 *   newState      – updated replan_state row to persist
 */

// ── Time helpers ─────────────────────────────────────────────────────────────

/** Parse "HH:MM" → total minutes since midnight */
function toMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Total minutes → "HH:MM" */
function toStr(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Add delta minutes to a "HH:MM" string */
function addMins(t, delta) {
  return toStr(toMins(t) + delta);
}

// ── Replan runner ─────────────────────────────────────────────────────────────

/**
 * Run the nth scripted replan (1-indexed).
 *
 * @param {number} replanNumber  – 1, 2, or 3
 * @param {object} db            – expo-sqlite sync DB handle
 * @returns {{ reason: string, what_changed: string }}
 */
export function runReplan(replanNumber, db) {
  const state = db.getFirstSync('SELECT * FROM replan_state WHERE id = 1');

  if (replanNumber === 1) {
    return _replan1(db, state);
  } else if (replanNumber === 2) {
    return _replan2(db, state);
  } else if (replanNumber === 3) {
    return _replan3(db, state);
  }
  throw new Error(`Unknown replan number: ${replanNumber}`);
}

// ── Replan 1: Train delay ─────────────────────────────────────────────────────

function _replan1(db, state) {
  // Move leave home 15 minutes earlier; transit and arrive shift too
  const delta = -15;
  const newLeave   = addMins(state.leave_home,   delta);
  const newTransit = addMins(state.transit_time, delta);
  const newArrive  = addMins(state.arrive_time,  delta);

  db.runSync(
    `UPDATE replan_state SET
       replans_used  = 1,
       leave_home    = ?,
       transit_time  = ?,
       arrive_time   = ?,
       transit_status = 'delayed'
     WHERE id = 1`,
    [newLeave, newTransit, newArrive]
  );

  const reason = 'Train delayed 12 minutes.';
  const what_changed =
    `Leave 15 minutes earlier (now ${_fmt(newLeave)}). ` +
    `Why: the delay would cause you to miss the doors opening.`;

  db.runSync(
    `INSERT INTO replan_log (replan_number, reason, what_changed) VALUES (1, ?, ?)`,
    [reason, what_changed]
  );

  return { reason, what_changed };
}

// ── Replan 2: Set moved later ─────────────────────────────────────────────────

function _replan2(db, state) {
  // Shift the first plan_item 30 minutes later; shift everything after it too
  const items = db.getAllSync(
    'SELECT id, start_time, end_time FROM plan_items ORDER BY start_time ASC'
  );

  if (items.length === 0) {
    // No plan items yet — just log a no-op
    const reason = 'Set time changed.';
    const what_changed = 'No sets in your plan yet — nothing to shift.';
    db.runSync(
      `INSERT INTO replan_log (replan_number, reason, what_changed) VALUES (2, ?, ?)`,
      [reason, what_changed]
    );
    db.runSync(`UPDATE replan_state SET replans_used = 2 WHERE id = 1`);
    return { reason, what_changed };
  }

  const delta = 30; // minutes
  const stmt = db.prepareSync(
    'UPDATE plan_items SET start_time = ?, end_time = ? WHERE id = ?'
  );
  for (const item of items) {
    stmt.executeSync([
      addMins(item.start_time, delta),
      addMins(item.end_time,   delta),
      item.id,
    ]);
  }
  stmt.finalizeSync();

  db.runSync(`UPDATE replan_state SET replans_used = 2 WHERE id = 1`);

  const first = items[0];
  const newStart = addMins(first.start_time, delta);
  const reason = 'Set time changed.';
  const what_changed =
    `Your first set moved 30 minutes later (now ${_fmt(newStart)}). ` +
    `All sets after it shifted too so your schedule still flows.`;

  db.runSync(
    `INSERT INTO replan_log (replan_number, reason, what_changed) VALUES (2, ?, ?)`,
    [reason, what_changed]
  );

  return { reason, what_changed };
}

// ── Replan 3: Rain alert ──────────────────────────────────────────────────────

function _replan3(db, state) {
  // Move all plan items 45 minutes earlier so you're inside before rain
  const items = db.getAllSync(
    'SELECT id, start_time, end_time FROM plan_items ORDER BY start_time ASC'
  );

  const delta = -45;
  if (items.length > 0) {
    const stmt = db.prepareSync(
      'UPDATE plan_items SET start_time = ?, end_time = ? WHERE id = ?'
    );
    for (const item of items) {
      stmt.executeSync([
        addMins(item.start_time, delta),
        addMins(item.end_time,   delta),
        item.id,
      ]);
    }
    stmt.finalizeSync();
  }

  // Update forecast
  db.runSync(
    `UPDATE forecast SET condition = 'Evening Rain', rain_chance = 85, updated_at = datetime('now') WHERE id = 1`
  );

  // Add rain jacket to packing list (only if not already there)
  const existing = db.getFirstSync(
    `SELECT id FROM packing_items WHERE label = 'Rain jacket / poncho'`
  );
  if (!existing) {
    db.runSync(
      `INSERT INTO packing_items (label, checked, is_user_item, source) VALUES ('Rain jacket / poncho', 0, 0, 'replan')`,
    );
  }

  db.runSync(`UPDATE replan_state SET replans_used = 3 WHERE id = 1`);

  const reason = 'Rain expected this evening.';
  const what_changed =
    `Your sets moved 45 minutes earlier so you are inside before the rain arrives. ` +
    `Forecast updated. Rain jacket added to your packing list.`;

  db.runSync(
    `INSERT INTO replan_log (replan_number, reason, what_changed) VALUES (3, ?, ?)`,
    [reason, what_changed]
  );

  return { reason, what_changed };
}

// ── Reset demo ────────────────────────────────────────────────────────────────

/**
 * Reset everything to the original demo state.
 * Clears plan_items, replan_log, resets replan_state and forecast,
 * and removes the rain-jacket packing item added by replan 3.
 */
export function resetDemo(db) {
  db.execSync(`
    DELETE FROM plan_items;
    DELETE FROM replan_log;
    UPDATE replan_state SET
      replans_used   = 0,
      leave_home     = '17:00',
      transit_time   = '17:20',
      arrive_time    = '18:25',
      transit_status = 'on_time'
    WHERE id = 1;
    UPDATE forecast SET
      condition    = 'Partly Cloudy',
      temp_f       = 78,
      rain_chance  = 20,
      updated_at   = datetime('now')
    WHERE id = 1;
    DELETE FROM packing_items WHERE source = 'replan';
  `);
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
