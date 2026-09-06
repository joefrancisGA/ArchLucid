import type { NextRequest } from "next/server";

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
