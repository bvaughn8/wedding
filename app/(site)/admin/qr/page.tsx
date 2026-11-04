import { guestName, inviteUrl, listHouseholds, requireAdmin, siteOrigin } from "@/lib/admin";
import { qrSvg } from "@/lib/qr";
import { PrintButton } from "../forms";

export default async function AdminQrPage() {
  await requireAdmin();
  const [households, { origin, fromEnv }] = await Promise.all([listHouseholds(), siteOrigin()]);
  const cards = await Promise.all(
    households.map(async (h) => {
      const url = inviteUrl(origin, h.invite_token);
      return { ...h, url, svg: await qrSvg(url) };
    }),
  );

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-serif text-4xl">QR codes</h1>
          <p className="mt-2 text-muted">
            One per household. Print this page, or download each as an SVG for the
            invitation designer.
          </p>
          {!fromEnv ? (
            <p className="mt-2 text-sm text-danger">
              These point at {origin}. Set SITE_URL to your real domain before printing.
            </p>
          ) : null}
        </div>
        <PrintButton />
      </header>

      {cards.length === 0 ? (
        <p className="text-muted">No households yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
          {cards.map((h) => (
            <li
              key={h.id}
              id={h.id}
              className="scroll-mt-6 break-inside-avoid rounded-2xl border border-line bg-white p-5 text-center print:rounded-none print:p-4"
            >
              <p className="font-serif text-2xl">{h.name}</p>
              <p className="mt-1 text-sm text-muted">{h.guests.map(guestName).join(", ")}</p>
              {/* SVG is generated server-side by the qrcode library from our own URL. */}
              <div
                className="mx-auto mt-3 w-48 max-w-full [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: h.svg }}
              />
              <p className="mt-2 break-all font-mono text-[10px] text-muted">{h.url}</p>
              <a
                href={`/admin/qr/${h.id}`}
                download
                className="mt-2 inline-block min-h-9 py-2 text-sm text-muted underline underline-offset-4 hover:text-ink print:hidden"
              >
                Download SVG
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
