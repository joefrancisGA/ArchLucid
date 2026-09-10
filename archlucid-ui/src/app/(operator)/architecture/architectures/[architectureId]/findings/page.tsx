import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchitectureNestedFindingsPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const metadata: Metadata = {
  title: "Findings",
};

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
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
