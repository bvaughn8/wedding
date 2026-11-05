import Link from "next/link";
import type { GuestLookup } from "@/lib/guest";

/**
 * Top nav. Signed-in guests get the full menu; visitors on public pages
 * (Our story) only see what they can open, plus RSVP, which goes through
 * sign-in first.
 */
export function SiteHeader({ current }: { current: GuestLookup }) {
  const guest = current.status === "ok" ? current.guest : null;

  return (
    <header className="border-b border-line bg-paper/85 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
        <Link href={guest ? "/" : "/about"} className="font-serif text-2xl">
          B <span className="text-accent">&amp;</span> S
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm sm:gap-x-5">
          {guest ? (
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
          ) : null}
          <Link href="/about" className="hover:text-accent">
            Our story
          </Link>
          <Link href="/rsvp" className="hover:text-accent">
            RSVP
          </Link>
          {guest?.is_admin ? (
            <Link href="/admin" className="hover:text-accent">
              Admin
            </Link>
          ) : null}
          {current.status === "signed-out" ? (
            <Link href="/login" className="text-muted hover:text-ink">
              Sign in
            </Link>
          ) : (
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

/** Pages that wrap themselves in .full-bleed (e.g. Our story) get the whole width. */
export function SiteMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 has-[>.full-bleed]:max-w-none has-[>.full-bleed]:p-0 print:max-w-none print:p-0">
      {children}
    </main>
  );
}
