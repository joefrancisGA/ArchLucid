import type { NextRequest } from "next/server";

import {
  DEV_TEST_ACTOR_ROLE_HEADER,
  isDevTestingOverridesEnabled,
  readDevRoleOverrideFromRequestCookies,
  resolveDevRoleOverrideApiActorRole,
} from "@/lib/dev-testing-overrides";

/** Resolves the upstream DevelopmentBypass test-actor role header from the browser cookie (local dev only). */
export function resolveDevRoleOverrideUpstreamHeader(request: NextRequest): string | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie");

  if (cookieHeader === null || cookieHeader.trim().length === 0) {
    return null;
  }

  const override = readDevRoleOverrideFromRequestCookies({
    get(name: string) {
      const prefix = `${name}=`;
      const match = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix));

      if (match === undefined) {
        return undefined;
      }

      return { value: decodeURIComponent(match.slice(prefix.length)) };
    },
  });

  if (override === null) {
    return null;
  }

  return resolveDevRoleOverrideApiActorRole(override);
}

export function applyDevRoleOverrideUpstreamHeader(headers: Headers, request: NextRequest): void {
  const actorRole = resolveDevRoleOverrideUpstreamHeader(request);

  if (actorRole !== null) {
    headers.set(DEV_TEST_ACTOR_ROLE_HEADER, actorRole);
  }
}
