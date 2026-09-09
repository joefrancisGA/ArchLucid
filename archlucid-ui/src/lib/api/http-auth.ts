/** Browser vs server detection and OIDC bearer helpers for ArchLucid API calls. */

import { getServerUpstreamAuthHeaders } from "@/lib/legacy-arch-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { ensureAccessTokenFresh } from "@/lib/oidc/session";

/** TB-284: buyer-polished shell requests audience-tier problem details (no internal route hints). */
export const PROBLEM_DETAILS_AUDIENCE_HEADER = "x-archlucid-audience";

export function audienceHeadersForCurrentShell(): Record<string, string> {
  return { [PROBLEM_DETAILS_AUDIENCE_HEADER]: "buyer" };
}

/** Returns true when executing in the browser (client component), false on the Node.js server (RSC). */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export async function ensureOidcBearerReady(): Promise<void> {
  if (isBrowser() && isJwtAuthMode()) {
    await ensureAccessTokenFresh();
  }
}

/**
 * LK-06 P2: browser proxy auth uses the HttpOnly BFF cookie — never attach Bearer from JS.
 */
export function getBearerToken(): string | undefined {
  if (typeof window !== "undefined") {
    return undefined;
  }

  if (!isJwtAuthMode()) {
    return undefined;
  }

  return undefined;
}

/** Server-side upstream auth headers (API key, etc.). */
export function getServerAuthHeaders(): Record<string, string> {
  return getServerUpstreamAuthHeaders();
}
