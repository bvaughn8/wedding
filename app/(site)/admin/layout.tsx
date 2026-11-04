import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin · Billy & Simmi" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <nav className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-3 text-sm print:hidden">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Admin</span>
        <Link href="/admin" className="hover:text-accent">
          Households
        </Link>
        <Link href="/admin/events" className="hover:text-accent">
          Events &amp; RSVPs
        </Link>
        <Link href="/admin/qr" className="hover:text-accent">
          QR codes
        </Link>
        <a href="/admin/export" className="hover:text-accent" download>
          Export CSV
        </a>
      </nav>
      {children}
    </div>
  );
}
