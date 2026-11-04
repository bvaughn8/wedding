import { getAdmin, inviteUrl, siteOrigin } from "@/lib/admin";
import { qrSvg } from "@/lib/qr";
import { createClient } from "@/lib/supabase/server";

/** GET /admin/qr/<household id> → that household's invite QR code as an SVG download. */
export async function GET(_req: Request, ctx: { params: Promise<{ householdId: string }> }) {
  // Route handlers don't run the (site)/admin layouts, so check here.
  if (!(await getAdmin())) return new Response("Not found", { status: 404 });

  const { householdId } = await ctx.params;
  const supabase = await createClient();
  const { data: h } = await supabase
    .from("households")
    .select("name, invite_token")
    .eq("id", householdId)
    .maybeSingle();
  if (!h) return new Response("Not found", { status: 404 });

  const { origin } = await siteOrigin();
  const svg = await qrSvg(inviteUrl(origin, h.invite_token));
  const filename = `${h.name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "invite"}-qr.svg`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
