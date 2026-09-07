import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchitectureNestedGraphPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/graph/ArchitectureNestedGraphPageClient";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { metadataForWorkingArchitectureNestedToolRoute } from "@/lib/architecture/working-architecture-document-title";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ architectureId: string }>;
}): Promise<Metadata> {
  const { architectureId } = await params;

  return metadataForWorkingArchitectureNestedToolRoute(architectureId, "Graph");
}

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export default async function ArchitectureNestedGraphPage({
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

  return <ArchitectureNestedGraphPageClient architectureId={resolved.architectureId} />;
}
