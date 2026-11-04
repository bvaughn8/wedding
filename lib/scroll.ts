// CSS-math helpers for scroll-driven scenes. A <ScrollScene> sets `--p` (0→1)
// as you scroll through it; these build style strings from that, so the
// animation runs entirely in CSS with no React re-renders.

/** 0 before `a`, 1 after `b`, linear in between. */
export function seg(a: number, b: number) {
  return `clamp(0, (var(--p) - ${a}) / ${b - a}, 1)`;
}

/** Unitless value going `from` → `to` while --p goes a → b. */
export function lerp(a: number, b: number, from: number, to: number) {
  return `calc(${from} + ${to - from} * ${seg(a, b)})`;
}

/** Same as lerp but with a CSS unit, e.g. lerpU(0, 1, 20, 0, "vh"). */
export function lerpU(a: number, b: number, from: number, to: number, unit: string) {
  return `calc((${from} + ${to - from} * ${seg(a, b)}) * 1${unit})`;
}
