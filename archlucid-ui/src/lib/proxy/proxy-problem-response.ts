import { NextResponse } from "next/server";

import { CORRELATION_ID_HEADER, generateCorrelationId } from "@/lib/correlation";

/** One-line JSON for operators scraping UI server logs (no response bodies). */
export function logProxyDiagnostic(
  event: string,
  fields: Record<string, string | number | undefined>,
): void {
  const cleaned: Record<string, string | number> = {};

  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) {
      cleaned[k] = v;
    }
  }

  console.warn(JSON.stringify({ component: "archlucid-ui-proxy", event, ...cleaned }));
}

/** Proxy-originated problem JSON: same shape as API hints; includes body + **X-Correlation-ID** for triage. */
export function respondWithProxyProblem(
  status: number,
  body: Record<string, unknown>,
  correlationId: string,
): NextResponse {
  const id =
    correlationId.trim().length > 0 ? correlationId.trim() : generateCorrelationId();
  const res = NextResponse.json({ ...body, correlationId: id }, { status });
  res.headers.set(CORRELATION_ID_HEADER, id);

  return res;
}
