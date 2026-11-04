// The "Our story" page: a sequence of scroll-driven scenes in the style of a
// product page — each scene pins to the screen while its content animates.
// Content (all placeholder for now) lives in content/about.ts.

import type { CSSProperties } from "react";
import Link from "next/link";
import { Counter } from "@/components/about/counter";
import { Photo } from "@/components/about/photo";
import { ScrollScene } from "@/components/about/scroll-scene";
import { WordReveal } from "@/components/about/word-reveal";
import { Heart, YarnUnderline } from "@/components/doodles";
import {
  billy,
  closing,
  intro,
  simmi,
  stats,
  timeline,
  type Person,
  type Photo as PhotoData,
} from "@/content/about";
import { signedPhotoUrls } from "@/lib/photos";
import { lerp, lerpU, seg } from "@/lib/scroll";

type TimelineItem = (typeof timeline)[number];

/** Must only render for signed-in guests: it signs private photo URLs. */
export async function AboutStory() {
  const all: PhotoData[] = [intro.photo, simmi.photo, billy.photo, ...timeline.map((t) => t.photo)];
  const urls = await signedPhotoUrls(all.flatMap((p) => (p.image ? [p.image] : [])));
  const withSrc = (p: PhotoData): PhotoData => ({ ...p, src: p.image ? urls.get(p.image) : undefined });

  return (
    <div className="full-bleed">
      <IntroScene photo={withSrc(intro.photo)} />
      <PersonScene person={{ ...simmi, photo: withSrc(simmi.photo) }} photoSide="left" />
      <PersonScene person={{ ...billy, photo: withSrc(billy.photo) }} photoSide="right" />
      <TimelineScene items={timeline.map((t) => ({ ...t, photo: withSrc(t.photo) }))} />
      <Stats />
      <ClosingScene />
    </div>
  );
}

/** Title, then a photo that grows from a small card to fill the screen. */
function IntroScene({ photo }: { photo: PhotoData }) {
  return (
    <ScrollScene length={260} stickyClassName="bg-paper/85">
      <div
        className="absolute inset-0 grid place-items-center px-4 text-center"
        style={{ opacity: `calc(1 - ${seg(0.04, 0.28)})`, scale: lerp(0.04, 0.28, 1, 0.9) }}
      >
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted">{intro.kicker}</p>
          <h1 className="mt-3 font-serif text-[clamp(3.5rem,13vw,10rem)] leading-none">
            Billy <span className="text-accent">&amp;</span> Simmi
          </h1>
          <YarnUnderline className="mx-auto w-56 sm:w-96" />
          <p className="mt-12 text-sm text-muted">Scroll to meet us</p>
          <svg viewBox="0 0 24 24" className="mx-auto mt-2 size-5 animate-bounce text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          opacity: seg(0.14, 0.3),
          scale: lerp(0.14, 0.7, 0.45, 1),
          borderRadius: lerpU(0.14, 0.7, 48, 0, "px"),
        }}
      >
        <Photo photo={photo} />
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-6 pb-14 pt-24 text-center text-white"
          style={{ opacity: seg(0.72, 0.88), translate: `0 ${lerpU(0.72, 0.88, 24, 0, "px")}` }}
        >
          <p className="mx-auto max-w-3xl font-serif text-3xl leading-tight sm:text-5xl">{intro.caption}</p>
        </div>
      </div>
    </ScrollScene>
  );
}

/**
 * One of us: a giant name drifts behind, the portrait rises in, the bio lights
 * up word by word, then three facts pop in. Billy's is mirrored.
 */
function PersonScene({ person, photoSide }: { person: Person; photoSide: "left" | "right" }) {
  const left = photoSide === "left";
  return (
    <ScrollScene length={320} stickyClassName="bg-paper/90">
      <p
        aria-hidden
        className="pointer-events-none absolute left-0 top-1/2 select-none whitespace-nowrap font-serif text-[32vw] leading-none text-ink/[0.05]"
        style={{ translate: `${lerpU(0, 1, left ? 12 : -45, left ? -45 : 12, "vw")} -50%` }}
      >
        {person.name}
      </p>

      <div className="relative mx-auto grid h-full max-w-6xl content-center items-center gap-5 px-5 py-10 md:grid-cols-2 md:gap-16">
        <div
          className={`min-w-0 ${left ? "" : "md:order-2"}`}
          style={{ opacity: seg(0, 0.16), translate: `0 ${lerpU(0, 0.22, 22, 0, "vh")}` }}
        >
          {/* Phones: sized by height. Wider screens: as big as fits both the
              column's width and 66% of the screen height, never overflowing. */}
          <div className="mx-auto aspect-[4/5] h-[30vh] overflow-hidden rounded-[2rem] shadow-xl shadow-ink/10 md:h-auto md:w-[min(100%,calc(66dvh*0.8))]">
            <Photo photo={person.photo} style={{ scale: lerp(0, 1, 1.18, 1) }} />
          </div>
        </div>

        {/* relative z-10: the animated portrait forms its own layer; keep text above it. */}
        <div className="relative z-10 min-w-0 text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-muted" style={{ opacity: seg(0.1, 0.18) }}>
            Meet {person.name}
          </p>
          <h2
            className="mt-2 font-serif text-3xl leading-tight sm:text-4xl md:text-6xl"
            style={{ opacity: seg(0.14, 0.26), translate: `0 ${lerpU(0.14, 0.26, 24, 0, "px")}` }}
          >
            {person.tagline}
          </h2>
          <WordReveal
            text={person.bio}
            from={0.26}
            to={0.7}
            className="mt-4 text-[15px] leading-relaxed sm:text-base md:text-xl"
          />
          <div className="mt-5 grid grid-cols-3 gap-2 md:mt-8 md:gap-3">
            {person.facts.map((f, i) => {
              const a = 0.72 + i * 0.06;
              return (
                <div
                  key={f.label}
                  className="rounded-2xl border border-line bg-white/80 p-2 text-center md:p-4 md:text-left"
                  style={{ opacity: seg(a, a + 0.08), scale: lerp(a, a + 0.08, 0.8, 1) }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted md:text-xs">{f.label}</p>
                  <p className="mt-1 font-serif text-base leading-tight md:text-xl">{f.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollScene>
  );
}

/** Scroll down, cards slide sideways. The card in the middle is in focus. */
function TimelineScene({ items }: { items: TimelineItem[] }) {
  const n = items.length;
  const pt = seg(0.08, 0.92); // timeline progress
  const pos = `(${pt} * ${n - 1})`; // which card is centred (0 … n-1)
  return (
    <ScrollScene length={420} stickyClassName="bg-ink text-paper">
      <div className="flex h-full flex-col justify-center gap-6 py-12 md:gap-10">
        <div className="px-6 text-center" style={{ opacity: seg(0, 0.08) }}>
          <p className="text-sm uppercase tracking-[0.3em] text-paper/60">Together</p>
          <h2 className="mt-2 font-serif text-4xl md:text-6xl">How we got here</h2>
        </div>

        <ol
          className="flex gap-6"
          style={
            {
              "--card": "min(78vw, 30rem)",
              paddingLeft: "calc(50% - var(--card) / 2)",
              translate: `calc(-1 * ${pos} * (var(--card) + 1.5rem)) 0`,
            } as CSSProperties
          }
        >
          {items.map((t, i) => {
            // 0 when this card is centred, 1 when it's a card or more away.
            const dist = `min(1, max(${pos} - ${i}, ${i} - ${pos}))`;
            return (
              <li
                key={t.title}
                className="w-[var(--card)] shrink-0 overflow-hidden rounded-3xl bg-paper/10 ring-1 ring-paper/15"
                style={{ opacity: `calc(1 - 0.6 * ${dist})`, scale: `calc(1 - 0.08 * ${dist})` }}
              >
                <div className="aspect-[4/3] max-h-[34vh] w-full overflow-hidden">
                  <Photo photo={t.photo} />
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-sm tracking-widest text-mustard">{t.when}</p>
                  <h3 className="mt-1 font-serif text-2xl md:text-3xl">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/75 md:text-base">{t.text}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mx-auto h-1 w-40 overflow-hidden rounded-full bg-paper/20" aria-hidden>
          <div className="h-full origin-left rounded-full bg-paper" style={{ scale: `${pt} 1` }} />
        </div>
      </div>
    </ScrollScene>
  );
}

function Stats() {
  return (
    <section className="bg-paper/90 px-4 py-24 text-center md:py-32">
      <p className="text-sm uppercase tracking-[0.3em] text-muted">So far</p>
      <h2 className="mt-2 font-serif text-4xl md:text-6xl">By the numbers</h2>
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-serif text-6xl text-accent-dark md:text-7xl">
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingScene() {
  return (
    <ScrollScene length={200} stickyClassName="bg-paper/85">
      <div className="grid h-full place-items-center px-4 text-center">
        <div>
          <Heart animated className="mx-auto size-14" style={{ opacity: seg(0, 0.3) }} />
          <h2
            className="mx-auto mt-4 max-w-5xl font-serif text-[clamp(2.5rem,8vw,6.5rem)] leading-[1.05]"
            style={{
              opacity: seg(0.05, 0.4),
              scale: lerp(0.05, 0.5, 0.85, 1),
              letterSpacing: lerpU(0.05, 0.5, 0.08, 0, "em"),
            }}
          >
            {closing.title}
          </h2>
          <p className="mt-6 text-lg text-muted" style={{ opacity: seg(0.4, 0.6) }}>
            {closing.text}
          </p>
          <div style={{ opacity: seg(0.5, 0.7) }}>
            <Link
              href="/rsvp"
              className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-accent px-8 font-medium text-white hover:bg-accent-dark"
            >
              RSVP
            </Link>
          </div>
        </div>
      </div>
    </ScrollScene>
  );
}
