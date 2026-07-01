import { cache } from "react";
import { cookies } from "next/headers";

import {
  OPERATOR_SCOPE_COOKIE_NAME,
  operatorScopeHeadersFromCookiePayload,
  parseOperatorScopeCookieValue,
} from "@/lib/operator-scope-cookie";
import { getScopeHeaders } from "@/lib/scope";

/** Server-only scope resolution: cookie mirror first, then dev/env defaults (TB-075). */
export const getServerResolvedScopeHeaders = cache(async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OPERATOR_SCOPE_COOKIE_NAME)?.value ?? null;
  const payload = parseOperatorScopeCookieValue(raw);

  if (payload !== null) {
    return operatorScopeHeadersFromCookiePayload(payload);
  }

  return getScopeHeaders();
});
