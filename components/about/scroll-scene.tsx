"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * A tall section whose content sticks to the screen while you scroll through
 * it. Sets `--p` from 0 (scene top reaches the top of the screen) to 1 (scene
 * is about to scroll away); children animate off it with lib/scroll helpers.
 *
 * With prefers-reduced-motion the scene collapses to one screen at --p: 1,
 * i.e. everything shown in its final state.
 */
export function ScrollScene({
  length = 300,
  className = "",
  stickyClassName = "",
  children,
}: {
  /** Scroll distance of the scene, in viewport heights. */
  length?: number;
  className?: string;
  stickyClassName?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reduce.matches) {
        el.style.setProperty("--p", "1");
        return;
      }
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 1;
      el.style.setProperty("--p", p.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduce.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduce.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`relative motion-reduce:!h-auto ${className}`}
      style={{ height: `${length}vh`, "--p": 0 } as CSSProperties}
    >
      <div className={`sticky top-0 h-dvh overflow-hidden ${stickyClassName}`}>{children}</div>
    </div>
  );
}
