import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchitectureNestedFindingsPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient";
import { metadataForWorkingArchitectureNestedToolRoute } from "@/lib/architecture/working-architecture-document-title";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ architectureId: string }>;
}): Promise<Metadata> {
  const segment = decodeRouteSegment((await params).architectureId);

  if (isInvalidGuidOrSlugRouteToken(segment)) {
    return { title: "Findings" };
  }

  const resolved = await resolveArchitectureRouteSegment(segment);

  if (resolved.kind !== "identity") {
    return { title: "Findings" };
  }

  return metadataForWorkingArchitectureNestedToolRoute(resolved.architectureId, "Findings");
}

export default async function ArchitectureNestedFindingsPage({
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

  return <ArchitectureNestedFindingsPageClient architectureId={resolved.architectureId} />;
}
