import type { NextRequest } from "next/server";

/** Blocks cross-site session establishment and teardown (login CSRF / session swap). */
export function isSameOriginBffRequest(request: NextRequest): boolean {
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

function resolvePostLogoutRedirectUri(request: NextRequest): string {
  const fixed = process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI?.trim() ?? "";

  if (fixed.length > 0) {
    return fixed;
  }

  return `${request.nextUrl.origin}/`;
}

export function resolveOidcPostLogoutRedirectUri(request: NextRequest): string {
  return resolvePostLogoutRedirectUri(request);
}
