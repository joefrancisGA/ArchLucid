import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchitectureNestedFindingsPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient";
import { metadataForWorkingArchitectureNestedToolRoute } from "@/lib/architecture/working-architecture-document-title";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { loadInhabitedFindingsInitialTrailBundle } from "@/lib/inhabit/load-inhabited-findings-initial-trail-bundle";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return "";
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
  searchParams,
}: {
  params: Promise<{ architectureId: string }>;
  searchParams: Promise<{ runId?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const segment = decodeRouteSegment((await params).architectureId);

  if (isInvalidGuidOrSlugRouteToken(segment)) {
    notFound();
  }

  const resolved = await resolveArchitectureRouteSegment(segment);

  if (resolved.kind !== "identity") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const scopedRunIdParam = resolvedSearchParams.runId;
  const scopedRunId = Array.isArray(scopedRunIdParam)
    ? scopedRunIdParam[0]?.trim() ?? ""
    : scopedRunIdParam?.trim() ?? "";
  const inhabitedFindingsInitialTrailBundle =
    scopedRunId.length > 0 ? await loadInhabitedFindingsInitialTrailBundle(scopedRunId) : null;

  return (
    <ArchitectureNestedFindingsPageClient
      architectureId={resolved.architectureId}
      inhabitedFindingsInitialTrailBundle={inhabitedFindingsInitialTrailBundle}
    />
  );
}
