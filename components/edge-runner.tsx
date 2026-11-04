"use client";

// A little runner (Billy) doing laps around the edge of the screen: along the
// bottom, up the right side, across the top (upside down), and down the left.
// Simmi sits on the bottom edge crocheting. When he reaches her he stops, they
// lean in for a kiss, a heart floats up, and he carries on.
//
// The lap is a CSS animation (see .edge-runner* in globals.css); touching him
// with the cursor (or a tap) reverses it and flips him round. Hidden entirely
// for prefers-reduced-motion.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Heart } from "@/components/doodles";

const LAP_MS = 40_000; // must match the edge-lap duration in globals.css
const KISS_MS = 1900; // how long they stop for the kiss

function lapAnimation(el: HTMLElement | null) {
  return el
    ?.getAnimations()
    .find((a) => a instanceof CSSAnimation && a.animationName === "edge-lap");
}

type FloatingHeart = { id: number; x: number; bottom: number; size: number };

// Kiss geometry, in fractions of each figure's box (see the SVG viewBoxes):
// both lean from bottom-centre; heads are 7-unit circles.
const RUNNER_LEAN = 24; // degrees
const SIMMI_LEAN = 12;
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Centre-to-centre distance at which, once both lean in, their heads just
 * touch. Computed from where the heads actually are, not the (much wider)
 * boxes, so it works at any size.
 */
function kissDistance(rw: number, rh: number, sw: number, sh: number) {
  // His head: x 22/40 across, 9/48 down. Hers: centred, 13/48 down.
  const hisUp = (1 - 9 / 48) * rh;
  const hisSide = (22 / 40 - 0.5) * rw;
  const hisX = hisSide * Math.cos(rad(RUNNER_LEAN)) + hisUp * Math.sin(rad(RUNNER_LEAN));
  const herX = (1 - 13 / 48) * sh * Math.sin(rad(SIMMI_LEAN));
  const radii = (7 / 48) * (rh + sh);
  return hisX + herX + radii * 0.8; // a little overlap so it reads as a kiss
}

export function EdgeRunner() {
  const track = useRef<HTMLDivElement>(null);
  const runner = useRef<HTMLDivElement>(null);
  const simmi = useRef<HTMLDivElement>(null);
  const lastTurn = useRef(0);
  const kissingRef = useRef(false);
  const [reversed, setReversed] = useState(false);
  const [startled, setStartled] = useState(false);
  const [kissing, setKissing] = useState(false);
  const [simmiFacesLeft, setSimmiFacesLeft] = useState(true); // he usually arrives from the left
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    // Running backwards from time 0 would stop the animation, so start him
    // 1000 laps in (same spot on screen) to leave plenty of room to reverse.
    const lap = lapAnimation(runner.current);
    if (lap) lap.currentTime = Number(lap.currentTime ?? 0) + LAP_MS * 1000;
  }, []);

  // Watch for him reaching Simmi along the bottom edge.
  useEffect(() => {
    let frame = 0;
    let armed = true; // needs to have been apart before the next kiss
    const timers: number[] = [];

    const check = () => {
      frame = requestAnimationFrame(check);
      const lap = lapAnimation(runner.current);
      const t = track.current?.getBoundingClientRect();
      const r = runner.current?.getBoundingClientRect();
      const s = simmi.current?.getBoundingClientRect();
      if (!lap || !t || !r || !s || kissingRef.current || lap.playState !== "running") return;

      const onBottom = r.bottom >= t.bottom - 2 && r.height > r.width; // upright on the floor
      const dx = s.left + s.width / 2 - (r.left + r.width / 2); // + means she's to his right
      const touching = kissDistance(r.width, r.height, s.width, s.height);
      const forward = lap.playbackRate > 0; // forward = moving right along the bottom

      if (!onBottom || Math.abs(dx) > touching + 24) {
        armed = true;
        return;
      }
      const approaching = forward ? dx > 0 : dx < 0;
      if (!armed || !approaching || Math.abs(dx) > touching) return;

      // Kiss!
      armed = false;
      kissingRef.current = true;
      lap.pause();
      setSimmiFacesLeft(dx > 0);
      setKissing(true);
      const id = performance.now();
      // Heart starts where their heads meet.
      const dir = dx > 0 ? 1 : -1;
      const herHeadX = s.left + s.width / 2 - dir * (1 - 13 / 48) * s.height * Math.sin(rad(SIMMI_LEAN));
      const heart = {
        id,
        x: herHeadX - dir * (7 / 48) * s.height - t.left,
        bottom: Math.round((1 - 13 / 48) * s.height * Math.cos(rad(SIMMI_LEAN))),
        size: Math.round(r.height * 0.42),
      };
      timers.push(window.setTimeout(() => setHearts((h) => [...h, heart]), 450));
      timers.push(window.setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 3200));
      timers.push(
        window.setTimeout(() => {
          setKissing(false);
          kissingRef.current = false;
          lap.play();
        }, KISS_MS),
      );
    };

    frame = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, []);

  function turnAround() {
    const now = performance.now();
    if (kissingRef.current || now - lastTurn.current < 600) return; // no flapping, no interrupting
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

  // Lean towards each other: he leans the way he's facing, she leans towards him.
  const runnerStyle: CSSProperties = {
    scale: reversed ? "-1 1" : undefined,
    rotate: kissing ? `${reversed ? -RUNNER_LEAN : RUNNER_LEAN}deg` : undefined,
  };
  const simmiStyle: CSSProperties = {
    scale: simmiFacesLeft ? "-1 1" : undefined,
    rotate: kissing ? `${simmiFacesLeft ? -SIMMI_LEAN : SIMMI_LEAN}deg` : undefined,
  };

  return (
    <div ref={track} aria-hidden className="edge-runner-track pointer-events-none fixed inset-1 z-30">
      <div ref={simmi} className="edge-simmi" data-kissing={kissing || undefined}>
        <SimmiFigure style={simmiStyle} />
      </div>

      <div
        ref={runner}
        className="edge-runner pointer-events-auto"
        data-kissing={kissing || undefined}
        onPointerEnter={turnAround}
      >
        {startled ? (
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-serif text-lg font-semibold leading-none text-blush-dark">
            !
          </span>
        ) : null}
        <RunnerFigure style={runnerStyle} />
      </div>

      {hearts.map((h) => (
        <div key={h.id} className="kiss-heart" style={{ left: h.x, bottom: h.bottom, width: h.size, height: h.size }}>
          <Heart className="size-full" />
        </div>
      ))}
    </div>
  );
}

function RunnerFigure({ style }: { style: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 48" className="edge-runner-body h-full w-full overflow-visible" style={style}>
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

      {/* head, curly brown hair, and a blush headband */}
      <circle cx="22" cy="9" r="7" fill="#efcdb2" />
      <g fill="#6b4a32">
        <path d="M15 8.6C14.4 3 18.4.7 22 1c3.8-.2 7.6 2 7 7.4-1.4-1-2.6-.8-3.2.2-.9-1.2-2.4-1.4-3.6-.4-1.1-1-2.7-1-3.8 0-1.2-.9-2.6-.6-3.4.4z" />
        <circle cx="17.4" cy="3.4" r="2.5" />
        <circle cx="21.6" cy="1.8" r="2.7" />
        <circle cx="26.2" cy="2.8" r="2.5" />
        <circle cx="15.2" cy="10.6" r="2.3" />
        <circle cx="16" cy="13.2" r="1.7" />
      </g>
      <path d="M15.6 7.2c4-1.6 8.8-1.6 12.8 0" stroke="var(--color-blush-dark)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M15.8 7.4 11 5.6M15.8 7.6 11.4 9.4" stroke="var(--color-blush-dark)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="25.4" cy="9.6" r="1" fill="var(--color-ink)" />
      <path d="M24.6 13c1 .6 2 .6 2.8 0" stroke="var(--color-ink)" strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Simmi sitting cross-legged, crocheting a granny square. Faces right as drawn. */
function SimmiFigure({ style }: { style: CSSProperties }) {
  const hair = "#3a2c26";
  return (
    <svg viewBox="0 0 44 48" className="edge-simmi-body h-full w-full overflow-visible" style={style}>
      {/* long hair, behind */}
      <path d="M14.2 12.5C13 4 31 4 29.8 12.5l1.4 14.5c-4 2.2-14.4 2.2-18.4 0z" fill={hair} />

      {/* cross-legged lap */}
      <ellipse cx="22" cy="41.5" rx="13.5" ry="5.2" fill="var(--color-sky-dark)" />
      <ellipse cx="22" cy="40" rx="9" ry="2.4" fill="#8aa1b0" />

      {/* sweater */}
      <path d="M15 23.5c0-3.4 14-3.4 14 0l1.4 13H13.6z" fill="var(--color-blush)" />

      {/* yarn ball with a strand to her hands */}
      <path d="M28.6 32.2c4.6 1.6 3.6 7.6 8.2 9.6" stroke="var(--color-blush-dark)" strokeWidth="1" fill="none" strokeLinecap="round" />
      <g className="simmi-ball">
        <circle cx="38.5" cy="43" r="4.2" fill="var(--color-mustard)" />
        <path d="M35 41.6c2.4 1 4.6 1 7 0M35.4 44.2c2.2.9 4.2.9 6.4 0M37.2 39.2c-.9 2.6-.9 5.2 0 7.6" stroke="#c4a868" strokeWidth=".8" fill="none" />
      </g>

      {/* the granny square in progress */}
      <g className="simmi-work">
        <rect x="19.5" y="29.5" width="9" height="6.4" rx="1" fill="var(--color-sage-light)" />
        <rect x="21.4" y="30.8" width="5.2" height="3.8" rx=".6" fill="var(--color-mustard)" />
        <rect x="23" y="31.9" width="2" height="1.6" rx=".4" fill="var(--color-blush-dark)" />
      </g>

      {/* arms */}
      <path d="M17.2 24.5 19.6 31l4 .6" stroke="#d99f97" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M26.6 24.5 29 30l-1.4 1.6" stroke="var(--color-blush)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="27.6" cy="31.4" r="1.6" fill="#ecc6a6" />
      <circle cx="23.4" cy="31.6" r="1.5" fill="#ecc6a6" />

      {/* crochet hook, working away */}
      <g className="simmi-hook">
        <path d="M27.6 31.4 33.8 24.6" stroke="var(--color-mustard)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M33.8 24.6c.9-.9 2.1-.2 1.4.8" stroke="var(--color-mustard)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>

      {/* head */}
      <circle cx="22" cy="13" r="7" fill="#ecc6a6" />
      {/* full head of hair: over the crown, with a fringe swept back from the face */}
      <path
        d="M14.3 15A7.7 7.7 0 0 1 29.7 12.2C27.6 9.4 24.4 9 21.8 10.4 19.4 11.7 17.9 12 16.9 15.6z"
        fill={hair}
      />
      <circle cx="25.4" cy="13.6" r=".95" fill="var(--color-ink)" />
      <circle cx="26.4" cy="15.6" r="1.3" fill="var(--color-blush)" opacity=".8" />
      <path d="M24.2 16.6c.9.6 1.9.6 2.7 0" stroke="var(--color-ink)" strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );
}
