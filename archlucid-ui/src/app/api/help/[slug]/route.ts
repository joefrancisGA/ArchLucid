import { type NextRequest, NextResponse } from "next/server";

import { readNextPublicAuthMode } from "@/lib/legacy-arch-env";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import type { CurrentPrincipal } from "@/lib/current-principal";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import {
  fetchPrincipalWithHeadersForHelpRoute,
  getServerCurrentPrincipal,
} from "@/lib/server-current-principal";

export type HelpArticleResponse = {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  markdown: string;
};

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
): Promise<NextResponse<HelpArticleResponse | { error: string }>> {
  const { slug } = await props.params;
  const loaded = tryLoadProductDocumentation(slug);

  if (loaded === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (loaded.entry.contentKind === "internal-runbook") {
    const inboundAuthorization = request.headers.get("authorization")?.trim() ?? "";
    let principal: CurrentPrincipal;

    if (inboundAuthorization.length > 0) {
      const scopeHeaders = await getServerResolvedScopeHeaders();
      principal = await fetchPrincipalWithHeadersForHelpRoute({
        Accept: "application/json",
        Authorization: inboundAuthorization,
        ...scopeHeaders,
      });
    } else if (readNextPublicAuthMode() === "development-bypass") {
      // development-bypass: browser calls have no JWT; match RSC/proxy server-side API key auth.
      principal = await getServerCurrentPrincipal();
    } else {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!principalCanAccessHelpTopic(loaded.entry, principal)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({
    slug,
    title: loaded.entry.title,
    summary: loaded.entry.summary,
    audience: loaded.entry.audience,
    markdown: loaded.markdown,
  });
}
