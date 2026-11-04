// Hand-drawn-style SVG doodles of Billy & Simmi's favourite things.
// Pure SVG + CSS (animations live in app/globals.css, and switch off for
// prefers-reduced-motion), so these are server components with no JS.

import type { CSSProperties } from "react";

type DoodleProps = { className?: string; animated?: boolean; style?: CSSProperties };

const a = (animated: boolean | undefined, cls: string) => (animated ? cls : undefined);

/** Ball of yarn with a crochet hook. */
export function Yarn({ className, animated, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className ?? ""}`} style={style} aria-hidden>
      <g className={a(animated, "anim-spin")}>
        <circle cx="30" cy="32" r="20" fill="var(--color-blush)" />
        <g fill="none" stroke="var(--color-blush-dark)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 26c9 5 25 5 36-3" />
          <path d="M10.5 35c11 6 28 6 39-2" />
          <path d="M15 45c9 4 21 4 30-2" />
          <path d="M23 13.5c-5 11-5 26 1 37" />
          <path d="M36 12.5c6 11 7 26 1 38" />
        </g>
      </g>
      <path
        d="M47 43c5 3 9 7 7 12s-8 3-6-2"
        fill="none"
        stroke="var(--color-blush-dark)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g className={a(animated, "anim-sway")}>
        <path d="M55 5 39 29" stroke="var(--color-mustard)" strokeWidth="3" strokeLinecap="round" />
        <path d="M55 5c2-2 5 0 3 3" fill="none" stroke="var(--color-mustard)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Running shoe with speed lines. */
export function Shoe({ className, animated, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className ?? ""}`} style={style} aria-hidden>
      <g
        className={a(animated, "anim-speed")}
        stroke="var(--color-sky)"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M2 31h6" />
        <path d="M0 38h8" />
        <path d="M3 45h4" />
      </g>
      <g className={a(animated, "anim-run")}>
        <path
          d="M12 42c0-7 3-12 8-13l7-1c2 0 3-5 7-5 3 0 4 3 7 5l9 5c5 2 8 4 8 8v3H12z"
          fill="var(--color-sky)"
        />
        <path
          d="M10 45h48c2 0 3 1 3 3s-1 3-3 3H15c-3 0-5-2-5-5z"
          fill="#fff"
          stroke="var(--color-sky-dark)"
          strokeWidth="1.5"
        />
        <path d="M29 30l5 4M32 27l5 4M35 25l5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 40h22" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      </g>
    </svg>
  );
}

/** Little plane, pointing right, centred on (0,0). */
function PlaneShape({ color = "var(--color-ink)" }: { color?: string }) {
  return (
    <g stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d="M-9 0H9" />
      <path d="M3 0-3-7M3 0-3 7" />
      <path d="M-7 0-10-4M-7 0-10 4" />
    </g>
  );
}

/** Globe with a plane circling it. */
export function Globe({ className, animated, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className ?? ""}`} style={style} aria-hidden>
      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-line)" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle cx="32" cy="32" r="16" fill="var(--color-sage-light)" />
      <path
        d="M22 25c3-3 7-2 8 1s-2 5 1 7 1 6-3 6-5-4-6-7-2-5 0-7zM36 20c3 0 6 2 6 5s-3 3-5 2-4-1-4-3 1-4 3-4zM38 34c3-1 6 1 5 4s-4 4-6 3-2-6 1-7z"
        fill="var(--color-accent)"
      />
      <g className={a(animated, "anim-orbit")}>
        <g transform="translate(32 6)">
          <PlaneShape />
        </g>
      </g>
    </svg>
  );
}

/** Steaming bowl of noodles with chopsticks. */
export function Bowl({ className, animated, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className ?? ""}`} style={style} aria-hidden>
      <g fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" opacity=".55">
        <path className={a(animated, "anim-steam")} d="M20 24c-3-4 3-6 0-11" />
        <path
          className={a(animated, "anim-steam")}
          style={{ "--delay": "0.8s" } as CSSProperties}
          d="M28 22c-3-4 3-6 0-11"
        />
        <path
          className={a(animated, "anim-steam")}
          style={{ "--delay": "1.6s" } as CSSProperties}
          d="M36 24c-3-4 3-6 0-11"
        />
      </g>
      <path d="M41 6 31 34M48 8 35 35" stroke="var(--color-mustard)" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M13 34c4-4 8 4 12 0s8 4 12 0 8 4 12 0"
        fill="none"
        stroke="var(--color-mustard)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M8 34h48c0 13-10 22-24 22S8 47 8 34z" fill="var(--color-blush)" />
      <path d="M12 41h40" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function Heart({ className, animated, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className ?? ""}`} style={style} aria-hidden>
      <path
        className={a(animated, "anim-pulse")}
        d="M32 54C10 40 8 22 20 18c6-2 10 2 12 6 2-4 6-8 12-6 12 4 10 22-12 36z"
        fill="var(--color-blush)"
      />
    </svg>
  );
}

/** A dashed flight path across the hero with a plane flying along it. */
export function FlightPath({ className }: { className?: string }) {
  const d = "M12 96C110 20 190 24 250 66s130 44 180-6 120-52 158-18";
  return (
    <svg viewBox="0 0 600 120" className={className} aria-hidden>
      <path id="flight-path" d={d} fill="none" stroke="var(--color-line)" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round" />
      <circle cx="12" cy="96" r="4" fill="var(--color-accent)" />
      <g transform="translate(588 42) scale(.35) translate(-32 -36)">
        <path d="M32 54C10 40 8 22 20 18c6-2 10 2 12 6 2-4 6-8 12-6 12 4 10 22-12 36z" fill="var(--color-blush)" />
      </g>
      {/* SMIL animation; hidden for reduced motion via .motion-only */}
      <g className="motion-only">
        <g>
          <PlaneShape color="var(--color-accent-dark)" />
          <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
            <mpath href="#flight-path" />
          </animateMotion>
        </g>
      </g>
    </svg>
  );
}

/** Hand-drawn yarn underline that "stitches" itself in, ending in a little loop. */
export function YarnUnderline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 34" className={className} aria-hidden>
      <path
        className="anim-draw"
        pathLength={1}
        d="M6 20C60 8 92 30 142 18s74-14 104 0c10 5 22 2 20-7-2-7-13-3-9 6 4 9 22 8 52-2"
        fill="none"
        stroke="var(--color-blush-dark)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
