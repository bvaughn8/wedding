import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentGuest } from "@/lib/guest";

export const dynamic = "force-dynamic";

/** Everything in (site) is for signed-in guests who are on the guest list. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentGuest();
  if (current.status === "signed-out") redirect("/login");
  if (current.status === "not-invited") redirect("/not-invited");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-paper/85 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="font-serif text-2xl">
            B <span className="text-accent">&amp;</span> S
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm sm:gap-x-5">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <Link href="/about" className="hover:text-accent">
              Our story
            </Link>
            <Link href="/rsvp" className="hover:text-accent">
              RSVP
            </Link>
            {current.guest.is_admin ? (
              <Link href="/admin" className="hover:text-accent">
                Admin
              </Link>
            ) : null}
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      {/* Pages that wrap themselves in .full-bleed (e.g. Our story) get the whole width. */}
      <main className="mx-auto max-w-4xl px-4 py-10 has-[>.full-bleed]:max-w-none has-[>.full-bleed]:p-0 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
