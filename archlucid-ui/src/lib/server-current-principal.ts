import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { getServerApiBaseUrl } from "@/lib/config";
import {
  normalizeAuthMeResponse,
  type AuthMeResponse,
  type CurrentPrincipal,
} from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { getServerUpstreamAuthHeaders } from "@/lib/legacy-arch-env";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import { SERVER_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";

function createUnauthenticatedServerPrincipal(): CurrentPrincipal {
  return {
    provenance: "synthetic",
    syntheticReason: "non-browser",
    name: null,
    roleClaimValues: [],
    primaryAppRole: null,
    maxAuthority: "ReadAuthority",
    authorityRank: AUTHORITY_RANK.ReadAuthority,
    hasEnterpriseOperatorSurfaces: false,
    hasCommittedArchitectureReview: false,
    hasRecognizedArchLucidRole: false,
    permissionClaimValues: [],
  };
}

async function fetchPrincipalWithHeaders(
  requestHeaders: Record<string, string>,
): Promise<CurrentPrincipal> {
  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/api/auth/me`;

  try {
    const response = await fetch(url, {
      headers: requestHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(SERVER_UPSTREAM_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return createUnauthenticatedServerPrincipal();
    }

    const body = (await response.json()) as AuthMeResponse;

    return normalizeAuthMeResponse(body);
  } catch {
    return createUnauthenticatedServerPrincipal();
  }
}

/**
 * Resolves the operator principal on the server for RSC/API routes (TB-735).
 * Forwards inbound `Authorization` when present; otherwise uses dev/proxy upstream auth headers.
 */
export const getServerCurrentPrincipal = cache(async (): Promise<CurrentPrincipal> => {
  const headerStore = await headers();
  const inboundAuthorization = headerStore.get("authorization")?.trim() ?? "";
  const scopeHeaders = await getServerResolvedScopeHeaders();
  const upstreamAuthHeaders = getServerUpstreamAuthHeaders();

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...scopeHeaders,
    ...upstreamAuthHeaders,
  };

  if (inboundAuthorization.length > 0) {
    requestHeaders.Authorization = inboundAuthorization;
  }

  return fetchPrincipalWithHeaders(requestHeaders);
});

export async function fetchPrincipalWithHeadersForHelpRoute(
  requestHeaders: Record<string, string>,
): Promise<CurrentPrincipal> {
  return fetchPrincipalWithHeaders(requestHeaders);
}

/**
 * Admin-gated help topics must not inherit the UI service API key as the visitor identity (TB-735).
 * Only trusts inbound `Authorization` plus tenant scope headers.
 */
export const getInboundAuthenticatedServerPrincipal = cache(async (): Promise<CurrentPrincipal> => {
  const headerStore = await headers();
  const inboundAuthorization = headerStore.get("authorization")?.trim() ?? "";

  if (inboundAuthorization.length === 0) {
    return createUnauthenticatedServerPrincipal();
  }

  const scopeHeaders = await getServerResolvedScopeHeaders();

  return fetchPrincipalWithHeaders({
    Accept: "application/json",
    Authorization: inboundAuthorization,
    ...scopeHeaders,
  });
});
