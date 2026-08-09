import { type NextRequest, NextResponse } from "next/server";

import { readNextPublicAuthMode } from "@/lib/legacy-arch-env";
import { canDownloadHelpTopicPdf } from "@/lib/product-documentation-pdf-access";
import { resolvePublicHelpTopicPdfHref } from "@/lib/product-documentation-pdf-href";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { readCustomerHelpTopicPdf } from "@/lib/read-customer-help-topic-pdf";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import {
  fetchPrincipalWithHeadersForHelpRoute,
  getServerCurrentPrincipal,
} from "@/lib/server-current-principal";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await props.params;
  const entry = getProductDocumentationEntry(slug);

  if (entry === null || entry.pdfStatus === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (entry.pdfStatus === "public") {
    return NextResponse.redirect(new URL(resolvePublicHelpTopicPdfHref(slug), request.url));
  }

  const inboundAuthorization = request.headers.get("authorization")?.trim() ?? "";
  const hasInboundAuthorization = inboundAuthorization.length > 0;

  let principal: Awaited<ReturnType<typeof getServerCurrentPrincipal>>;
  let authorizationBasis: boolean;

  if (hasInboundAuthorization) {
    const scopeHeaders = await getServerResolvedScopeHeaders();
    principal = await fetchPrincipalWithHeadersForHelpRoute({
      Accept: "application/json",
      Authorization: inboundAuthorization,
      ...scopeHeaders,
    });
    authorizationBasis = true;
  } else if (readNextPublicAuthMode() === "development-bypass") {
    // development-bypass: browser calls have no JWT; match RSC/proxy server-side API key auth.
    principal = await getServerCurrentPrincipal();
    authorizationBasis = principal.hasRecognizedArchLucidRole;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canDownloadHelpTopicPdf(entry, principal, authorizationBasis)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const loadedPdf = await readCustomerHelpTopicPdf(slug);

  if (loadedPdf === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // NextResponse BodyInit accepts Uint8Array; Node Buffer is not assignable under current DOM typings.
  return new NextResponse(new Uint8Array(loadedPdf.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      "Content-Length": String(loadedPdf.size),
      "Cache-Control": "private, no-store",
    },
  });
}
