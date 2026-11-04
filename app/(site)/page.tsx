import { getCurrentGuest } from "@/lib/guest";

export default async function HomePage() {
  const current = await getCurrentGuest();
  if (current.status !== "ok") return null; // layout already redirected
  const { guest } = current;

  return (
    <section className="text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-muted">Welcome</p>
      <h1 className="mt-3 font-serif text-5xl sm:text-6xl">Hi, {guest.first_name}</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        You&apos;re signed in as part of {guest.household.name}. Wedding details, RSVP
        and photos are coming soon.
      </p>
    </section>
  );
}
