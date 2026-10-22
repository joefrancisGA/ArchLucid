import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import {
  OPERATOR_SCOPE_COOKIE_NAME,
  operatorScopeHeadersFromCookiePayload,
  parseOperatorScopeCookieValue,
} from "@/lib/operator/operator-scope-cookie";
import { readServerSideApiKey } from "@/lib/legacy-arch-env";
import { getScopeHeaders } from "@/lib/scope";

/**
 * ApiKey upstream SSR must not send dev-default `x-*-id` headers without an operator scope cookie.
 * Claims-less keys 403 on any `x-tenant-id` (`ScopeIdentityBindingMiddleware`); bound keys resolve scope from claims.
 */
export function shouldOmitDevDefaultScopeHeadersForServerUpstream(): boolean {
  const apiKey = readServerSideApiKey()?.trim() ?? "";
  const bearer = process.env.ARCHLUCID_PROXY_BEARER_TOKEN?.trim() ?? "";

  return apiKey.length > 0 && bearer.length === 0;
}

/** Server-only scope resolution: cookie mirror first, then dev/env defaults (TB-075). */
export const getServerResolvedScopeHeaders = cache(async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OPERATOR_SCOPE_COOKIE_NAME)?.value ?? null;
  const payload = parseOperatorScopeCookieValue(raw);

  if (payload !== null) {
    return operatorScopeHeadersFromCookiePayload(payload);
  }

  if (shouldOmitDevDefaultScopeHeadersForServerUpstream()) {
    return {};
  }

  return getScopeHeaders();
});
