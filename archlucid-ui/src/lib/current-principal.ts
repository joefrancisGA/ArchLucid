/**
 * UI read-model for the authenticated operator principal.
 *
 * **Source of truth:** `GET /api/auth/me` on the C# API (`ArchLucid.Api.Controllers.Admin.AuthDebugController`),
 * same contract as `CallerIdentityResponse` / `CallerClaimResponse` (name + claims[]).
 * The browser reaches it via same-origin **`/api/proxy/api/auth/me`** (see `src/app/api/proxy/[...path]/route.ts`).
 *
 * This module is intentionally narrow: one fetch shape, one normalization path, no token lifecycle beyond
 * what `@/lib/oidc/session` already provides. **Do not duplicate backend authorization** — use this only for
 * UX shaping (nav, banners, copy). The API remains authoritative for 401/403.
 */

import {
  AUTHORITY_RANK,
  collectArchLucidRoleClaimValues,
  maxAuthorityRankFromMeClaims,
  requiredAuthorityFromRank,
  type RequiredAuthority,
} from "@/lib/nav-authority";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { ensureAccessTokenFresh, getAccessTokenForApi, isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** JSON body shape for `GET /api/auth/me` — mirrors `CallerIdentityResponse`. */
export type AuthMeResponse = {
  name?: string | null;
  claims?: ReadonlyArray<{ type: string; value: string }>;
};

/** ArchLucid app roles carried in JWT / dev-bypass claims (`ArchLucidRoles` on the server). */
export type ArchLucidAppRole = "Admin" | "Operator" | "Reader" | "Auditor";

export type CurrentPrincipalSyntheticReason = "jwt-unsigned" | "me-http" | "me-network" | "non-browser";

/**
 * Compact principal read-model for UI code paths (nav, feature hints, enterprise surfacing).
 * Prefer `loadCurrentPrincipal()` in client components; never assume this matches server enforcement.
 */
export type CurrentPrincipal = {
  /** `auth-me` when parsed from a successful `/me` response; `synthetic` when we did not call or could not trust `/me`. */
  provenance: "auth-me" | "synthetic";
  /** Populated only when `provenance === "synthetic"` — explains why we fell back. */
  syntheticReason?: CurrentPrincipalSyntheticReason;
  /** `User.Identity.Name` from the API when present */
  name: string | null;
  /** Distinct role claim values from `/me` (see `collectArchLucidRoleClaimValues` in `nav-authority.ts`) */
  roleClaimValues: readonly string[];
  /** Best-effort highest app role for labels; null when unknown (synthetic unsigned). */
  primaryAppRole: ArchLucidAppRole | null;
  /** Highest policy tier this principal is expected to satisfy — same strings as `ArchLucidPolicies` */
  maxAuthority: RequiredAuthority;
  /** Numeric rank for comparisons (1=Read, 2=Execute, 3=Admin) */
  authorityRank: number;
  /** True when the principal should see operator/admin-oriented Enterprise Controls hints (Execute+) */
  hasEnterpriseOperatorSurfaces: boolean;
};

const ME_PATH = "/api/proxy/api/auth/me";

/**
 * Builds default `RequestInit` for `/api/proxy/api/auth/me` in the browser (bearer + registration scope merge).
 * Reusable by any client code that needs the same headers as the operator shell.
 */
export async function buildAuthMeProxyRequestInit(): Promise<RequestInit> {
  await ensureAccessTokenFresh();

  const headers = new Headers({ Accept: "application/json" });
  const bearer = getAccessTokenForApi();

  if (bearer !== undefined && bearer !== null && bearer.trim().length > 0) {
    headers.set("Authorization", `Bearer ${bearer}`);
  }

  return mergeRegistrationScopeForProxy({
    cache: "no-store",
    credentials: "same-origin",
    headers,
  });
}

function createSyntheticPrincipal(reason: CurrentPrincipalSyntheticReason): CurrentPrincipal {
  return {
    provenance: "synthetic",
    syntheticReason: reason,
    name: null,
    roleClaimValues: [],
    primaryAppRole: null,
    maxAuthority: "ReadAuthority",
    authorityRank: AUTHORITY_RANK.ReadAuthority,
    hasEnterpriseOperatorSurfaces: false,
  };
}

function primaryAppRoleFromRank(rank: number, roleClaimValues: readonly string[]): ArchLucidAppRole | null {
  if (rank >= AUTHORITY_RANK.AdminAuthority) {
    return "Admin";
  }

  if (rank >= AUTHORITY_RANK.ExecuteAuthority) {
    return "Operator";
  }

  if (rank >= AUTHORITY_RANK.ReadAuthority) {
    const lower = roleClaimValues.map((v) => v.toLowerCase());

    if (lower.includes("auditor")) {
      return "Auditor";
    }

    return "Reader";
  }

  return null;
}

/**
 * Normalizes a successful `AuthMeResponse` body into `CurrentPrincipal`.
 * Exported for tests and for callers that already obtained JSON (e.g. diagnostics).
 */
export function normalizeAuthMeResponse(payload: AuthMeResponse): CurrentPrincipal {
  const claims = payload.claims ?? [];
  const authorityRank = maxAuthorityRankFromMeClaims(claims);
  const roleClaimValues = collectArchLucidRoleClaimValues(claims);
  const maxAuthority = requiredAuthorityFromRank(authorityRank);

  return {
    provenance: "auth-me",
    name: payload.name ?? null,
    roleClaimValues,
    primaryAppRole: primaryAppRoleFromRank(authorityRank, roleClaimValues),
    maxAuthority,
    authorityRank,
    hasEnterpriseOperatorSurfaces: authorityRank >= AUTHORITY_RANK.ExecuteAuthority,
  };
}

/**
 * Loads the current principal from `/api/proxy/api/auth/me`.
 *
 * - **Non-browser:** returns a synthetic Read principal (`non-browser`) — do not call from RSC for real auth state.
 * - **JWT, not signed in:** synthetic Read (`jwt-unsigned`) without calling `/me`.
 * - **development-bypass:** calls `/me` using the proxy’s server API key so the dev role still shapes the UI.
 * - **`/me` failure:** conservative synthetic Read (`me-http` / `me-network`).
 */
export async function loadCurrentPrincipal(options?: { init?: RequestInit }): Promise<CurrentPrincipal> {
  if (typeof window === "undefined") {
    return createSyntheticPrincipal("non-browser");
  }

  if (isJwtAuthMode() && !isLikelySignedIn()) {
    return createSyntheticPrincipal("jwt-unsigned");
  }

  try {
    const init = options?.init ?? (await buildAuthMeProxyRequestInit());
    const response = await fetch(ME_PATH, init);

    if (!response.ok) {
      return createSyntheticPrincipal("me-http");
    }

    const body = (await response.json()) as AuthMeResponse;

    return normalizeAuthMeResponse(body);
  } catch {
    return createSyntheticPrincipal("me-network");
  }
}

/** Alias for `loadCurrentPrincipal` — same contract; pick whichever reads clearer at the call site. */
export const getCurrentPrincipal = loadCurrentPrincipal;

/**
 * Returns only the normalized max policy tier (Reader→ReadAuthority, Operator→ExecuteAuthority, Admin→AdminAuthority).
 * Prefer `loadCurrentPrincipal()` when you also need name, roles, or enterprise surfacing flags.
 */
export async function getCurrentAuthority(options?: { init?: RequestInit }): Promise<RequiredAuthority> {
  const principal = await loadCurrentPrincipal(options);

  return principal.maxAuthority;
}

/**
 * Returns the numeric authority rank (see `AUTHORITY_RANK` in `nav-authority.ts`).
 */
export async function getCurrentAuthorityRank(options?: { init?: RequestInit }): Promise<number> {
  const principal = await loadCurrentPrincipal(options);

  return principal.authorityRank;
}
