/**
 * lib/routing.js
 *
 * In-app walking route calculator for the festival map (800 × 900).
 *
 * Street centerlines:
 *   Horizontal: y=365, x 30–770
 *               y=750, x 30–770
 *   Vertical:   x=310, y 90–750
 *               x=560, y 365–750
 *
 * Junctions: (310,365), (310,750), (560,365), (560,750)
 *
 * Walking speed: 80 map units per minute (rounded up).
 *
 * Returns { path: [[x,y],...], minutes: number }
 */

// ─── Street graph nodes ────────────────────────────────────────────────────

const JUNCTIONS = [
  { id: 'j_310_365', x: 310, y: 365 },
  { id: 'j_310_750', x: 310, y: 750 },
  { id: 'j_560_365', x: 560, y: 365 },
  { id: 'j_560_750', x: 560, y: 750 },
];

// Entrance point
export const ENTRANCE = { id: 'entrance', x: 332, y: 757 };

// Stage positions (matches DB seed)
const STAGE_POSITIONS = [
  { id: 1,  x: 435, y: 560 },
  { id: 2,  x: 200, y: 640 },
  { id: 3,  x: 150, y: 520 },
  { id: 4,  x: 230, y: 460 },
  { id: 5,  x:  85, y: 500 },
  { id: 6,  x: 220, y: 260 },
  { id: 7,  x: 420, y: 130 },
  { id: 8,  x: 400, y: 220 },
  { id: 9,  x: 480, y: 280 },
  { id: 10, x: 560, y: 230 },
  { id: 11, x: 590, y: 140 },
  { id: 12, x: 650, y: 520 },
  { id: 13, x: 680, y: 640 },
];

// Amenity positions (index-keyed for routing; matches cue-map-data.json order)
export const AMENITIES = [
  { idx: 0,  type: 'first_aid',  x: 352, y: 292 },
  { idx: 1,  type: 'food',       x: 362, y: 118 },
  { idx: 2,  type: 'food',       x: 620, y: 300 },
  { idx: 3,  type: 'restroom',   x: 612, y: 196 },
  { idx: 4,  type: 'restroom',   x: 436, y: 312 },
  { idx: 5,  type: 'water',      x: 480, y: 170 },
  { idx: 6,  type: 'bar',        x: 365, y: 165 },
  { idx: 7,  type: 'merch',      x: 540, y: 300 },
  { idx: 8,  type: 'accessible', x: 372, y: 262 },
  { idx: 9,  type: 'info',       x: 520, y: 112 },
  { idx: 10, type: 'food',       x: 172, y: 214 },
  { idx: 11, type: 'food',       x: 266, y: 306 },
  { idx: 12, type: 'restroom',   x: 172, y: 306 },
  { idx: 13, type: 'water',      x: 266, y: 218 },
  { idx: 14, type: 'bar',        x: 120, y: 436 },
  { idx: 15, type: 'lockers',    x:  60, y: 440 },
  { idx: 16, type: 'restroom',   x:  90, y: 600 },
  { idx: 17, type: 'food',       x: 262, y: 574 },
  { idx: 18, type: 'first_aid',  x: 262, y: 690 },
  { idx: 19, type: 'water',      x: 120, y: 690 },
  { idx: 20, type: 'accessible', x: 262, y: 630 },
  { idx: 21, type: 'merch',      x: 150, y: 586 },
  { idx: 22, type: 'first_aid',  x: 508, y: 432 },
  { idx: 23, type: 'water',      x: 360, y: 500 },
  { idx: 24, type: 'restroom',   x: 352, y: 604 },
  { idx: 25, type: 'food',       x: 508, y: 500 },
  { idx: 26, type: 'accessible', x: 508, y: 604 },
  { idx: 27, type: 'merch',      x: 392, y: 436 },
  { idx: 28, type: 'lockers',    x: 470, y: 690 },
  { idx: 29, type: 'lost_found', x: 510, y: 690 },
  { idx: 30, type: 'info',       x: 352, y: 436 },
  { idx: 31, type: 'bar',        x: 480, y: 436 },
  { idx: 32, type: 'restroom',   x: 612, y: 440 },
  { idx: 33, type: 'food',       x: 730, y: 450 },
  { idx: 34, type: 'food',       x: 612, y: 590 },
  { idx: 35, type: 'water',      x: 730, y: 580 },
  { idx: 36, type: 'first_aid',  x: 730, y: 690 },
  { idx: 37, type: 'bar',        x: 612, y: 690 },
  { idx: 38, type: 'merch',      x: 730, y: 520 },
  { idx: 39, type: 'box_office', x: 436, y: 750 },
  { idx: 40, type: 'info',       x: 232, y: 750 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Find the nearest point on any street centerline for a given (x, y).
 * Returns { x, y } snapped onto a street.
 */
function snapToStreet(x, y) {
  const candidates = [];

  // Horizontal street y=365, x 30–770
  candidates.push({ x: Math.min(770, Math.max(30, x)), y: 365 });
  // Horizontal street y=750, x 30–770
  candidates.push({ x: Math.min(770, Math.max(30, x)), y: 750 });
  // Vertical street x=310, y 90–750
  candidates.push({ x: 310, y: Math.min(750, Math.max(90, y)) });
  // Vertical street x=560, y 365–750
  candidates.push({ x: 560, y: Math.min(750, Math.max(365, y)) });

  let best = candidates[0];
  let bestD = dist({ x, y }, best);
  for (const c of candidates.slice(1)) {
    const d = dist({ x, y }, c);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/**
 * Build the graph for Dijkstra.
 * Nodes: junctions + snapped street nodes for start and destination.
 * Edges: connections along the four street segments.
 */
function buildGraph(startSnap, startId, destSnap, destId) {
  // All nodes
  const nodes = [
    ...JUNCTIONS.map(j => ({ ...j })),
    { id: startId, x: startSnap.x, y: startSnap.y },
    { id: destId,  x: destSnap.x,  y: destSnap.y  },
  ];

  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;

  // Edges: pairs of nodes that share the same street segment
  const edges = [];

  function addEdge(a, b) {
    const d = dist(a, b);
    edges.push({ from: a.id, to: b.id, d });
    edges.push({ from: b.id, to: a.id, d });
  }

  // Collect all nodes on each street, sort by position, link neighbors
  function linkStreet(streetNodes) {
    if (streetNodes.length < 2) return;
    for (let i = 0; i < streetNodes.length - 1; i++) {
      addEdge(streetNodes[i], streetNodes[i + 1]);
    }
  }

  // ── Horizontal y=365 (x 30–770) ─────────────────────────────
  const h365 = nodes
    .filter(n => n.y === 365 && n.x >= 30 && n.x <= 770)
    .sort((a, b) => a.x - b.x);
  linkStreet(h365);

  // ── Horizontal y=750 (x 30–770) ─────────────────────────────
  const h750 = nodes
    .filter(n => n.y === 750 && n.x >= 30 && n.x <= 770)
    .sort((a, b) => a.x - b.x);
  linkStreet(h750);

  // ── Vertical x=310 (y 90–750) ───────────────────────────────
  const v310 = nodes
    .filter(n => n.x === 310 && n.y >= 90 && n.y <= 750)
    .sort((a, b) => a.y - b.y);
  linkStreet(v310);

  // ── Vertical x=560 (y 365–750) ──────────────────────────────
  const v560 = nodes
    .filter(n => n.x === 560 && n.y >= 365 && n.y <= 750)
    .sort((a, b) => a.y - b.y);
  linkStreet(v560);

  return { nodeMap, edges };
}

// ─── Dijkstra ──────────────────────────────────────────────────────────────

function dijkstra(nodeMap, edges, startId, destId) {
  const dist = {};
  const prev = {};
  const unvisited = new Set(Object.keys(nodeMap));

  for (const id of unvisited) dist[id] = Infinity;
  dist[startId] = 0;

  while (unvisited.size > 0) {
    // Pick unvisited node with smallest dist
    let u = null;
    for (const id of unvisited) {
      if (u === null || dist[id] < dist[u]) u = id;
    }
    if (u === destId || dist[u] === Infinity) break;
    unvisited.delete(u);

    for (const edge of edges) {
      if (edge.from !== u || !unvisited.has(edge.to)) continue;
      const alt = dist[u] + edge.d;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
      }
    }
  }

  // Reconstruct path
  const path = [];
  let cur = destId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return { path, totalDist: dist[destId] };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Calculate route between two points (each is { x, y }).
 * Returns { polyline: [[x,y],...], minutes: number }
 *
 * @param {object} start  - { x, y } of start point
 * @param {object} dest   - { x, y } of destination point
 * @param {string} startLabel - unique id string for start node
 * @param {string} destLabel  - unique id string for dest node
 */
export function calcRoute(start, dest, startLabel = 'start', destLabel = 'dest') {
  const startSnap = snapToStreet(start.x, start.y);
  const destSnap  = snapToStreet(dest.x,  dest.y);

  const { nodeMap, edges } = buildGraph(startSnap, startLabel, destSnap, destLabel);

  const { path, totalDist } = dijkstra(nodeMap, edges, startLabel, destLabel);

  // Build polyline: startPoint → street snap → ...nodes... → dest street snap → destPoint
  const polyline = [];
  polyline.push([start.x, start.y]);
  if (startSnap.x !== start.x || startSnap.y !== start.y) {
    polyline.push([startSnap.x, startSnap.y]);
  }
  for (const id of path) {
    if (id === startLabel || id === destLabel) continue;
    const n = nodeMap[id];
    polyline.push([n.x, n.y]);
  }
  if (destSnap.x !== dest.x || destSnap.y !== dest.y) {
    polyline.push([destSnap.x, destSnap.y]);
  }
  polyline.push([dest.x, dest.y]);

  // Walking time: total path length ÷ 80 units/min, rounded up
  // Total path length = sum of segment lengths in polyline
  let pathLength = dist({ x: start.x, y: start.y }, { x: startSnap.x, y: startSnap.y });
  pathLength += totalDist;
  pathLength += dist({ x: destSnap.x, y: destSnap.y }, { x: dest.x, y: dest.y });

  const minutes = Math.ceil(pathLength / 80);

  return { polyline, minutes };
}

/**
 * Get the { x, y } position for a stage id (number), 'entrance', or amenity_N (index).
 */
export function getPosition(id) {
  if (id === 'entrance') return { x: ENTRANCE.x, y: ENTRANCE.y };
  if (typeof id === 'string' && id.startsWith('amenity_')) {
    const idx = parseInt(id.replace('amenity_', ''), 10);
    const a = AMENITIES.find(am => am.idx === idx);
    return a ? { x: a.x, y: a.y } : null;
  }
  const s = STAGE_POSITIONS.find(p => p.id === id);
  return s ? { x: s.x, y: s.y } : null;
}

/**
 * Find the nearest amenity of the given type from a start { x, y }.
 * Returns { amenity, route } where route is { polyline, minutes }.
 */
export function findNearestAmenity(startPos, amenityType, startLabel = 'start') {
  const candidates = AMENITIES.filter(a => a.type === amenityType);
  if (!candidates.length) return null;

  let best = null;
  let bestRoute = null;

  for (const a of candidates) {
    const destLabel = `amenity_${a.idx}`;
    const route = calcRoute(startPos, { x: a.x, y: a.y }, startLabel, destLabel);
    if (!best || route.minutes < bestRoute.minutes) {
      best = a;
      bestRoute = route;
    }
  }

  return { amenity: best, route: bestRoute };
}
