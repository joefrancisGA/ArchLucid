/** Decode JWT `exp` claim (Unix seconds). Returns null when absent or unparsable. */
export function decodeJwtExpirySeconds(token: string): number | null {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      return null;
    }

    const payloadSegment = parts[1];
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { exp?: unknown };

    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) {
      return null;
    }

    return parsed.exp;
  } catch {
    return null;
  }
}

/** Minimum session lifetime (seconds) required before a 30-minute CTO demo. */
export const DEMO_MINIMUM_SESSION_SECONDS = 40 * 60;
