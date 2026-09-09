import { NextRequest, NextResponse } from "next/server";

import { getOidcAuthority } from "@/lib/oidc/config";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import {
  isBffSessionCookieEnabled,
  parseBffSessionPayloadFromRequest,
} from "@/lib/proxy/bff-session-cookie";
import { resolveOidcPostLogoutRedirectUri } from "@/lib/proxy/bff-session-request";

/** Returns an OIDC RP-initiated logout URL when id_token_hint is held in the BFF session (LK-06 P2). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isBffSessionCookieEnabled()) {
    return NextResponse.json({ url: null });
  }

  const payload = parseBffSessionPayloadFromRequest(request);
  const idToken = payload?.it?.trim() ?? "";
  const authority = getOidcAuthority();

  if (payload === null || idToken.length === 0 || authority.length === 0) {
    return NextResponse.json({ url: null });
  }

  try {
    const doc = await loadDiscoveryDocument(authority);

    if (!doc.end_session_endpoint) {
      return NextResponse.json({ url: null });
    }

    const url = new URL(doc.end_session_endpoint);

    url.searchParams.set("id_token_hint", idToken);
    url.searchParams.set("post_logout_redirect_uri", resolveOidcPostLogoutRedirectUri(request));

    return NextResponse.json({ url: url.toString() });
  } catch {
    return NextResponse.json({ url: null });
  }
}
