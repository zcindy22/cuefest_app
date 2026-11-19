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
 * Get the { x, y } position for a stage id or 'entrance'.
 */
export function getPosition(stageIdOrEntrance) {
  if (stageIdOrEntrance === 'entrance') return { x: ENTRANCE.x, y: ENTRANCE.y };
  const s = STAGE_POSITIONS.find(p => p.id === stageIdOrEntrance);
  return s ? { x: s.x, y: s.y } : null;
}
