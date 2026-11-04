import type { CSSProperties, ComponentType } from "react";
import { Bowl, Globe, Shoe, Yarn } from "@/components/doodles";

type Thing = {
  label: string;
  blurb: string;
  Icon: ComponentType<{ className?: string; animated?: boolean }>;
  tint: string;
};

// Edit the blurbs freely — they're placeholders in our voice.
const THINGS: Thing[] = [
  { label: "Crochet", blurb: "Yarn, hooks and very cosy gifts", Icon: Yarn, tint: "bg-blush/25" },
  { label: "Running", blurb: "Early miles and race-day medals", Icon: Shoe, tint: "bg-sky/25" },
  { label: "Travel", blurb: "Passports out, next trip planned", Icon: Globe, tint: "bg-sage-light/35" },
  { label: "Food", blurb: "Always thinking about the next meal", Icon: Bowl, tint: "bg-mustard/20" },
];

export function FavoriteThings() {
  return (
    <section className="mt-16">
      <h2 className="text-center font-serif text-3xl sm:text-4xl">A few of our favourite things</h2>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {THINGS.map(({ label, blurb, Icon, tint }, i) => (
          <li
            key={label}
            className="anim-rise hover-wiggle rounded-2xl border border-line bg-white/70 p-4 text-center"
            style={{ "--delay": `${0.9 + i * 0.15}s` } as CSSProperties}
          >
            <div className={`doodle-tile-icon mx-auto grid size-24 place-items-center rounded-full sm:size-28 ${tint}`}>
              <Icon animated className="size-20 sm:size-24" />
            </div>
            <p className="mt-3 font-serif text-2xl">{label}</p>
            <p className="mt-1 text-sm text-muted">{blurb}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
