import { SiteHeader, SiteMain } from "@/components/site-header";
import { getCurrentGuest } from "@/lib/guest";

export const dynamic = "force-dynamic";

/**
 * Public pages (Our story): open to anyone, no guest-list check. Also listed
 * in PUBLIC_PATHS in lib/supabase/proxy.ts. Nothing guest-specific belongs here.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentGuest();

  return (
    <div className="min-h-dvh">
      <SiteHeader current={current} />
      <SiteMain>{children}</SiteMain>
    </div>
  );
}
