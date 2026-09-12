import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchitectureNestedImpactPreviewPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/impact-preview/ArchitectureNestedImpactPreviewPageClient";
import { loadEvolutionReviewPageData } from "@/app/(operator)/insights/impact-preview/_sections/load-evolution-review-page-data";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { metadataForWorkingArchitectureNestedToolRoute } from "@/lib/architecture/working-architecture-document-title";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ architectureId: string }>;
}): Promise<Metadata> {
  const { architectureId } = await params;

  return metadataForWorkingArchitectureNestedToolRoute(architectureId, "Impact preview");
}

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export default async function ArchitectureNestedImpactPreviewPage({
  params,
}: {
  params: Promise<{ architectureId: string }>;
}): Promise<React.JSX.Element> {
  const segment = decodeRouteSegment((await params).architectureId);

  if (isInvalidGuidOrSlugRouteToken(segment)) {
    notFound();
  }

  const resolved = await resolveArchitectureRouteSegment(segment);

  if (resolved.kind !== "identity") {
    notFound();
  }

  const loaded = await loadEvolutionReviewPageData({});

  return (
    <ArchitectureNestedImpactPreviewPageClient
      architectureId={resolved.architectureId}
      loaded={loaded}
    />
  );
}
