"use client";

import { usePathname } from "next/navigation";
import { CrochetBackground } from "@/components/crochet-background";
import { EdgeRunner } from "@/components/edge-runner";

/**
 * The crochet blanket background and the edge runner, on every guest-facing
 * page (home, RSVP, sign-in, invite). Admin pages stay plain.
 */
export function SiteDecor() {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return (
    <div className="print:hidden">
      <CrochetBackground />
      <EdgeRunner />
    </div>
  );
}
