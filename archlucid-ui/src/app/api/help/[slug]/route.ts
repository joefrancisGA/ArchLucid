import { type NextRequest, NextResponse } from "next/server";

import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import {
  fetchPrincipalWithHeadersForHelpRoute,
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

    if (inboundAuthorization.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const scopeHeaders = await getServerResolvedScopeHeaders();
    const principal = await fetchPrincipalWithHeadersForHelpRoute({
      Accept: "application/json",
      Authorization: inboundAuthorization,
      ...scopeHeaders,
    });

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
