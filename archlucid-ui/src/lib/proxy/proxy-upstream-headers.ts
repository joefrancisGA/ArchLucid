import type { NextRequest } from "next/server";

import {
  CORRELATION_ID_HEADER,
  TRACE_PARENT_HEADER,
  generateCorrelationId,
  isSafeCorrelationId,
  isValidTraceParent,
} from "@/lib/correlation";
import { readServerSideApiKey } from "@/lib/legacy-arch-env";
import { resolveBffSessionBearerFromRequest } from "@/lib/proxy/bff-session-cookie";
import { applyDevAgentExecutionModeUpstreamHeader } from "@/lib/proxy/dev-agent-execution-mode-upstream";
import { applyDevRoleOverrideUpstreamHeader } from "@/lib/proxy/dev-role-override-upstream";
import { isAnonymousMarketingProxyPath } from "@/lib/proxy-anonymous-marketing-paths";
import { resolveProxyUpstreamScopeHeaders } from "@/lib/proxy-scope-resolution";

export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
/** Matches `ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength` on the API. */
export const MAX_IDEMPOTENCY_KEY_LENGTH = 256;
export const IDEMPOTENCY_REPLAYED_HEADER = "X-Idempotency-Replayed";

/**
 * Builds headers for the upstream C# API request.
 * Attaches API key, forwards browser Authorization header, and merges scope headers
 * In production-like posture, client scope headers are ignored (see `proxy-scope-resolution.ts`).
 */
export function buildProxyUpstreamHeaders(request: NextRequest, proxyPath?: string): Headers {
  const h = new Headers();
  const key = readServerSideApiKey()?.trim() ?? "";
  const authHeader = request.headers.get("authorization");
  const browserBearer = authHeader?.trim() ?? "";
  const cookieBearer = resolveBffSessionBearerFromRequest(request);
  const serverBearerToken = process.env.ARCHLUCID_PROXY_BEARER_TOKEN?.trim() ?? "";
  const skipPrivilegedUpstreamAuth =
    proxyPath !== undefined &&
    proxyPath.length > 0 &&
    isAnonymousMarketingProxyPath(proxyPath);
  const bearerToUse =
    cookieBearer.length > 0
      ? cookieBearer
      : browserBearer.length > 0
        ? browserBearer
        : !skipPrivilegedUpstreamAuth && serverBearerToken.length > 0
          ? `Bearer ${serverBearerToken}`
          : "";
  const hasBearer = bearerToUse.length > 0;

  if (key && !hasBearer && !skipPrivilegedUpstreamAuth) {
    h.set("X-Api-Key", key);
  }

  if (hasBearer) {
    h.set("Authorization", bearerToUse);
  }

  for (const [k, v] of Object.entries(resolveProxyUpstreamScopeHeaders(request.headers, undefined, proxyPath))) {
    h.set(k, v);
  }

  const incomingCorrelation = request.headers.get(CORRELATION_ID_HEADER);
  const correlationId =
    incomingCorrelation !== null &&
    incomingCorrelation !== undefined &&
    isSafeCorrelationId(incomingCorrelation)
      ? incomingCorrelation.trim()
      : generateCorrelationId();
  h.set(CORRELATION_ID_HEADER, correlationId);

  const incomingTraceParent = request.headers.get(TRACE_PARENT_HEADER);

  if (typeof incomingTraceParent === "string" && isValidTraceParent(incomingTraceParent)) {
    h.set(TRACE_PARENT_HEADER, incomingTraceParent.trim());
  }

  const incomingIdempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER)?.trim() ?? "";

  if (
    incomingIdempotencyKey.length > 0 &&
    incomingIdempotencyKey.length <= MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    h.set(IDEMPOTENCY_KEY_HEADER, incomingIdempotencyKey);
  }

  applyDevAgentExecutionModeUpstreamHeader(h, request);
  applyDevRoleOverrideUpstreamHeader(h, request);

  return h;
}
