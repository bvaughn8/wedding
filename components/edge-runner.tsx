"use client";

// A little runner doing laps around the edge of the screen: along the bottom,
// up the right side, across the top (upside down), and down the left.
// The lap is a CSS animation (see .edge-runner* in globals.css); touching him
// with the cursor (or a tap) reverses it and flips him to face the other way.
// Hidden entirely for prefers-reduced-motion.

import { useEffect, useRef, useState } from "react";

const LAP_MS = 40_000; // must match the edge-lap duration in globals.css

function lapAnimation(el: HTMLElement | null) {
  return el
    ?.getAnimations()
    .find((a) => a instanceof CSSAnimation && a.animationName === "edge-lap");
}

export function EdgeRunner() {
  const runner = useRef<HTMLDivElement>(null);
  const lastTurn = useRef(0);
  const [reversed, setReversed] = useState(false);
  const [startled, setStartled] = useState(false);

  useEffect(() => {
    // Running backwards from time 0 would stop the animation, so start him
    // 1000 laps in (same spot on screen) to leave plenty of room to reverse.
    const lap = lapAnimation(runner.current);
    if (lap) lap.currentTime = Number(lap.currentTime ?? 0) + LAP_MS * 1000;
  }, []);

  function turnAround() {
    const now = performance.now();
    if (now - lastTurn.current < 600) return; // don't flap while the cursor sits on him
    lastTurn.current = now;

    const lap = lapAnimation(runner.current);
    if (!lap) return;
    // Set directly (not updatePlaybackRate, which applies a frame later) so
    // quick double-turns can't leave his facing out of sync with his direction.
    lap.playbackRate = -lap.playbackRate;
    setReversed(lap.playbackRate < 0);
    setStartled(true);
    window.setTimeout(() => setStartled(false), 700);
  }

  return (
    <div aria-hidden className="edge-runner-track pointer-events-none fixed inset-1 z-30">
      <div ref={runner} className="edge-runner pointer-events-auto" onPointerEnter={turnAround}>
        {startled ? (
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-serif text-lg font-semibold leading-none text-blush-dark">
            !
          </span>
        ) : null}
        <svg
          viewBox="0 0 40 48"
          className="edge-runner-body h-full w-full overflow-visible"
          style={reversed ? { scale: "-1 1" } : undefined}
        >
          {/* back arm + back leg (darker, behind the body) */}
          <g className="runner-arm-b">
            <path d="M20 19l-5 6 2 5" stroke="#c99d82" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <g className="runner-leg-b">
            <path d="M18 30l-2 8 3 6" stroke="#a88b4c" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <ellipse cx="20.5" cy="44.5" rx="3.6" ry="1.9" fill="var(--color-sky-dark)" />
          </g>

          {/* torso (sage tee) */}
          <path d="M20.5 17.5 18 30" stroke="var(--color-accent)" strokeWidth="8" strokeLinecap="round" />
          {/* race bib */}
          <rect x="17.4" y="21" width="5" height="4" rx="1" fill="#fff" transform="rotate(-11 20 23)" />

          {/* front leg + front arm */}
          <g className="runner-leg-a">
            <path d="M18 30l-2 8 3 6" stroke="var(--color-mustard)" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <ellipse cx="20.5" cy="44.5" rx="3.6" ry="1.9" fill="var(--color-sky)" />
          </g>
          <g className="runner-arm-a">
            <path d="M20 19l-5 6 2 5" stroke="#e8c2a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>

          {/* head with a blush headband */}
          <circle cx="22" cy="9" r="7" fill="#efcdb2" />
          <path d="M15.6 7.2c4-1.6 8.8-1.6 12.8 0" stroke="var(--color-blush-dark)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M15.8 7.4 11 5.6M15.8 7.6 11.4 9.4" stroke="var(--color-blush-dark)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="25.4" cy="9.6" r="1" fill="var(--color-ink)" />
          <path d="M24.6 13c1 .6 2 .6 2.8 0" stroke="var(--color-ink)" strokeWidth="1" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}
