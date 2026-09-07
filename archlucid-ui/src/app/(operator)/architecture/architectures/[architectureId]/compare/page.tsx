import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchitectureNestedComparePageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/compare/ArchitectureNestedComparePageClient";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const metadata: Metadata = {
  title: "Compare",
};

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export default async function ArchitectureNestedComparePage({
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

  return <ArchitectureNestedComparePageClient architectureId={resolved.architectureId} />;
}
