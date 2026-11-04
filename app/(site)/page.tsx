import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Bowl, FlightPath, Globe, Heart, Shoe, Yarn, YarnUnderline } from "@/components/doodles";
import { getCurrentGuest } from "@/lib/guest";
import { loadHouseholdRsvp, missingAnswers } from "@/lib/rsvp";

export default async function HomePage() {
  const current = await getCurrentGuest();
  if (current.status !== "ok") return null; // layout already redirected
  const { guest } = current;

  const rsvp = await loadHouseholdRsvp(guest.household.id);
  const missing = missingAnswers(rsvp);

  return (
    <div>
      <section className="relative isolate text-center">
        <FloatingDoodles />

        <FlightPath className="mx-auto -mb-2 w-full max-w-xl" />

        <p className="anim-rise text-sm uppercase tracking-[0.25em] text-muted">Welcome</p>
        <h1
          className="anim-rise mt-3 font-serif text-5xl sm:text-7xl"
          style={{ "--delay": "0.15s" } as CSSProperties}
        >
          Hi, {guest.first_name}
        </h1>
        <YarnUnderline className="mx-auto -mt-1 w-56 sm:w-80" />
        <p
          className="anim-rise mx-auto mt-4 max-w-md text-muted"
          style={{ "--delay": "0.5s" } as CSSProperties}
        >
          You&apos;re signed in as part of {guest.household.name}. We can&apos;t wait to
          celebrate with you. Wedding details and photos are coming soon.
        </p>

        {rsvp.events.length ? (
          <div
            className="anim-rise mx-auto mt-8 max-w-md rounded-2xl border border-line bg-white/80 p-6 backdrop-blur-sm"
            style={{ "--delay": "0.7s" } as CSSProperties}
          >
            <p className="font-serif text-2xl">
              {missing === 0
                ? "Thanks for your RSVP"
                : rsvp.rsvps.length
                  ? "Your RSVP isn't finished"
                  : "Will you join us?"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {missing === 0
                ? "You can update it any time before the deadline."
                : `Please let us know who's coming to ${rsvp.events.length === 1 ? rsvp.events[0].name : "each event"}.`}
            </p>
            <Link
              href="/rsvp"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-6 font-medium text-white hover:bg-accent-dark"
            >
              {missing === 0 ? "View or change RSVP" : "RSVP now"}
              <Heart animated className="size-5 [&_path]:fill-white" />
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

/** Faint doodles drifting behind the hero. Fewer on phones so text stays clear. */
function FloatingDoodles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden sm:-inset-x-16">
      <Float className="left-0 top-24 w-12 sm:w-16" dur="8s" tilt="-12deg">
        <Yarn />
      </Float>
      <Float className="right-0 top-36 w-12 sm:w-16" dur="7s" delay="-2s" tilt="10deg">
        <Bowl />
      </Float>
      <Float className="left-[8%] bottom-6 hidden w-14 sm:block" dur="9s" delay="-4s" tilt="8deg">
        <Shoe />
      </Float>
      <Float className="right-[8%] bottom-10 hidden w-14 sm:block" dur="10s" delay="-1s" tilt="-6deg">
        <Globe />
      </Float>
      <Float className="left-[22%] top-6 hidden w-7 sm:block" dur="6s" delay="-3s">
        <Heart />
      </Float>
      <Float className="right-[20%] top-2 w-6" dur="6.5s" delay="-5s" tilt="12deg">
        <Heart />
      </Float>
    </div>
  );
}

function Float({
  children,
  className,
  dur,
  delay = "0s",
  tilt = "0deg",
}: {
  children: ReactNode;
  className: string;
  dur: string;
  delay?: string;
  tilt?: string;
}) {
  return (
    <div
      className={`anim-float absolute opacity-40 ${className}`}
      style={{ "--dur": dur, "--delay": delay, "--tilt": tilt } as CSSProperties}
    >
      {children}
    </div>
  );
}
