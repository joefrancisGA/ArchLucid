/**
 * ArchLucid staff / internal sales-ops shell — not for paying tenant administrators.
 *
 * Set `NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR=true` on founder or SRE builds only.
 * Customer-facing V1 shells omit system-admin navigation entirely (deep links still 403 without API policy).
 */
export function isArchLucidInternalOperatorShellEnv(): boolean {
  const raw = (process.env.NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR ?? "").trim().toLowerCase();

  return raw === "1" || raw === "true";
}
