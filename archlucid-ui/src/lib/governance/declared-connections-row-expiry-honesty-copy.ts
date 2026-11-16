import { parseIsoUtcMs } from "@/lib/format-iso-utc";

/** Per-row reminder beside a stored expiration instant — complements the page-level expiry line. */
export const DECLARED_CONNECTION_ROW_EXPIRY_HONESTY_LINE =
  "Path reasoning stops treating this row as active after the UTC instant shown — renew or replace before expiry." as const;

export function shouldShowDeclaredConnectionRowExpiryHonesty(expirationUtc: string | null | undefined): boolean {
  const trimmed = expirationUtc?.trim() ?? "";

  if (trimmed.length === 0) {
    return false;
  }

  return !Number.isNaN(parseIsoUtcMs(trimmed));
}