import { NextRequest, NextResponse } from "next/server";

import { BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";
import { isBffSessionIdleExpired } from "@/lib/proxy/bff-session-idle";
import {
  BFF_SESSION_COOKIE_NAME,
  buildBffSessionClearCookieHeaders,
  buildBffSessionCookieHeaders,
  isBffSessionCookieEnabled,
  parseBffSessionCookieValue,
  slideBffSessionActivity,
  type BffSessionPayload,
} from "@/lib/proxy/bff-session-cookie";
import { respondWithProxyProblem } from "@/lib/proxy/proxy-problem-response";
import type { ForwardMethod } from "@/lib/proxy/proxy-forward-types";

function isMutatingProxyMethod(method: ForwardMethod): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function isSameOriginProxyRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin")?.trim() ?? "";

  if (origin.length > 0) {
    return origin === request.nextUrl.origin;
  }

  const secFetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? "";

  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  const referer = request.headers.get("referer")?.trim() ?? "";

  if (referer.startsWith(request.nextUrl.origin)) {
    return true;
  }

  return false;
}

function appendSetCookieHeaders(response: NextResponse, cookieHeaders: readonly string[]): void {
  for (const cookieHeader of cookieHeaders) {
    response.headers.append("Set-Cookie", cookieHeader);
  }
}

function blockedMutationResponse(
  status: number,
  title: string,
  detail: string,
  correlationId: string,
  clearSession: boolean,
): NextResponse {
  const response = respondWithProxyProblem(
    status,
    {
      type: "about:blank",
      title,
      status,
      detail,
    },
    correlationId,
  );

  if (clearSession) {
    appendSetCookieHeaders(response, buildBffSessionClearCookieHeaders());
  }

  return response;
}

export type ProxyBffSessionGuardResult =
  | {
      readonly allowed: true;
      readonly payload: BffSessionPayload | null;
      readonly slideCookieHeaders: readonly string[];
    }
  | {
      readonly allowed: false;
      readonly response: NextResponse;
    };

/** Enforces BFF idle + CSRF on `/api/proxy` when the HttpOnly session is enabled (LK-07). */
export function enforceProxyBffSessionGuard(
  request: NextRequest,
  method: ForwardMethod,
  correlationId: string,
): ProxyBffSessionGuardResult {
  if (!isBffSessionCookieEnabled()) {
    return { allowed: true, payload: null, slideCookieHeaders: [] };
  }

  const cookieValue = request.cookies.get(BFF_SESSION_COOKIE_NAME)?.value ?? null;
  const payload = cookieValue !== null ? parseBffSessionCookieValue(cookieValue) : null;
  const browserBearer = request.headers.get("authorization")?.trim() ?? "";

  if (payload === null) {
    if (isMutatingProxyMethod(method) && browserBearer.length === 0) {
      return {
        allowed: false,
        response: blockedMutationResponse(
          401,
          "BFF session required",
          "Mutating proxy calls require an active HttpOnly BFF session.",
          correlationId,
          false,
        ),
      };
    }

    return { allowed: true, payload: null, slideCookieHeaders: [] };
  }

  if (Date.now() >= payload.exp) {
    return {
      allowed: false,
      response: blockedMutationResponse(
        401,
        "BFF session expired",
        "Sign in again to continue.",
        correlationId,
        true,
      ),
    };
  }

  if (isBffSessionIdleExpired(payload)) {
    return {
      allowed: false,
      response: blockedMutationResponse(
        401,
        "BFF session idle timeout",
        "Sign in again after inactivity.",
        correlationId,
        true,
      ),
    };
  }

  if (isMutatingProxyMethod(method)) {
    if (!isSameOriginProxyRequest(request)) {
      return {
        allowed: false,
        response: blockedMutationResponse(
          403,
          "Cross-site proxy mutation blocked",
          "Mutating proxy calls must originate from the same site.",
          correlationId,
          false,
        ),
      };
    }

    const csrfHeader = request.headers.get(BFF_CSRF_HEADER)?.trim() ?? "";

    if (csrfHeader.length === 0 || csrfHeader !== payload.csrf) {
      return {
        allowed: false,
        response: blockedMutationResponse(
          403,
          "CSRF validation failed",
          "Mutating proxy calls require a valid BFF CSRF token.",
          correlationId,
          false,
        ),
      };
    }
  }

  const slid = slideBffSessionActivity(payload);
  const slideCookieHeaders =
    slid === null ? [] : buildBffSessionCookieHeaders(slid, payload.exp);

  return {
    allowed: true,
    payload,
    slideCookieHeaders,
  };
}

export function appendProxyBffSlideCookieHeaders(
  response: NextResponse,
  slideCookieHeaders: readonly string[],
): NextResponse {
  if (slideCookieHeaders.length > 0) {
    appendSetCookieHeaders(response, slideCookieHeaders);
  }

  return response;
}
