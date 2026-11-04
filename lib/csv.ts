function csvCell(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  // Quote everything; neutralise leading =,+,-,@ so spreadsheets don't run it as a formula.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** A downloadable CSV. Starts with a BOM so Excel reads it as UTF-8. */
export function csvResponse(rows: (string | number | null | undefined)[][], filename: string) {
  const body = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
