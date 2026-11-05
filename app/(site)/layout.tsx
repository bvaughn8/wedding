import { redirect } from "next/navigation";
import { SiteHeader, SiteMain } from "@/components/site-header";
import { getCurrentGuest } from "@/lib/guest";

export const dynamic = "force-dynamic";

/** Everything in (site) is for signed-in guests who are on the guest list. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentGuest();
  if (current.status === "signed-out") redirect("/login");
  if (current.status === "not-invited") redirect("/not-invited");

  return (
    <div className="min-h-dvh">
      <SiteHeader current={current} />
      <SiteMain>{children}</SiteMain>
    </div>
  );
}
