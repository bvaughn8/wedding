// A full-page granny-square blanket. Each square is built like the real thing:
// rounds of 3-double-crochet clusters with chain-space gaps between them, a
// new colour each round, finished with a cream single-crochet border that
// joins the squares. Drawn as one repeating SVG tile (2×2 squares) — no JS.

type Yarn = { fill: string; shade: string };

const YARN = {
  blush: { fill: "#e9bcb5", shade: "#c99890" },
  sage: { fill: "#bccdae", shade: "#98ab89" },
  mustard: { fill: "#e8cf8f", shade: "#c4a868" },
  sky: { fill: "#b5cad6", shade: "#8fa7b5" },
  cream: { fill: "#f3ebdd", shade: "#d9ccb7" },
} satisfies Record<string, Yarn>;

const HOLE = "#e0d3c0"; // what shows through the chain spaces
const SQUARE = 112; // px, one granny square including its border
const C = SQUARE / 2;
const ROUND_RADII = [8, 18.5, 29, 39.5]; // centre-to-side distance of each round
// Classic granny: one cluster per side in the centre round, then growing.
const CLUSTERS_PER_SIDE = [1, 3, 4, 5];
const BORDER_RADIUS = 49.5;
const SCALE = 1.1;

/** One double-crochet post (long, with a yarn-over tick), standing on (x, y). */
function dc(x: number, y: number, { fill, shade }: Yarn) {
  return (
    `<rect x="${x - 1.7}" y="${y - 5}" width="3.4" height="10" rx="1.7" fill="${fill}" stroke="${shade}" stroke-width=".6"/>` +
    `<path d="M${x - 1.5} ${y + 1}L${x + 1.5} ${y - 1.5}" stroke="${shade}" stroke-width=".8" stroke-linecap="round"/>`
  );
}

/** One single-crochet stitch for the border (short and squat). */
function sc(x: number, y: number, { fill, shade }: Yarn) {
  return `<rect x="${x - 1.3}" y="${y - 2.7}" width="2.6" height="5.4" rx="1.3" fill="${fill}" stroke="${shade}" stroke-width=".5"/>`;
}

/** The top side of a round; rotated four times to make the whole round. */
function roundSide(round: number, yarn: Yarn) {
  const s = ROUND_RADII[round];
  const clusters = CLUSTERS_PER_SIDE[round];
  let out = "";
  for (let i = 0; i < clusters; i++) {
    const x = C - s + (2 * s * (i + 0.5)) / clusters;
    for (const dx of [-3.5, 0, 3.5]) out += dc(x + dx, C - s, yarn);
  }
  return out;
}

function borderSide(yarn: Yarn) {
  const s = BORDER_RADIUS;
  const n = 34;
  let out = "";
  for (let i = 0; i < n; i++) out += sc(C - s + (2 * s * (i + 0.5)) / n, C - s, yarn);
  return out;
}

function fourSides(side: string) {
  return [0, 90, 180, 270]
    .map((deg) => `<g transform="rotate(${deg} ${C} ${C})">${side}</g>`)
    .join("");
}

function grannySquare(x: number, y: number, rounds: Yarn[]) {
  const inner = BORDER_RADIUS - 3;
  return (
    `<g transform="translate(${x} ${y})">` +
    `<rect x="${C - inner}" y="${C - inner}" width="${inner * 2}" height="${inner * 2}" rx="3" fill="${HOLE}"/>` +
    rounds.map((yarn, r) => fourSides(roundSide(r, yarn))).join("") +
    fourSides(borderSide(YARN.cream)) +
    `</g>`
  );
}

function tileSvg() {
  const { blush, sage, mustard, sky } = YARN;
  const size = SQUARE * 2;
  const squares = [
    grannySquare(0, 0, [mustard, blush, sage, sky]),
    grannySquare(SQUARE, 0, [sky, mustard, blush, sage]),
    grannySquare(0, SQUARE, [blush, sage, sky, mustard]),
    grannySquare(SQUARE, SQUARE, [sage, sky, mustard, blush]),
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${YARN.cream.fill}"/>${squares.join("")}</svg>`;
}

const PATTERN = `url("data:image/svg+xml,${encodeURIComponent(tileSvg())}")`;
const TILE_PX = SQUARE * 2 * SCALE;

/** Fixed behind the whole page, with a soft glow in the middle so text stays easy to read. */
export function CrochetBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20"
      style={{
        backgroundImage: `radial-gradient(ellipse 62% 50% at 50% 34%, rgb(250 247 242 / 0.9), rgb(250 247 242 / 0.6) 55%, rgb(250 247 242 / 0.2)), ${PATTERN}`,
        backgroundSize: `auto, ${TILE_PX}px ${TILE_PX}px`,
        backgroundPosition: "center, center top",
      }}
    />
  );
}
