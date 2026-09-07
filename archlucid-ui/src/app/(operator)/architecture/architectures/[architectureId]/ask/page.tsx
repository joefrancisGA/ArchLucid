import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchitectureNestedAskPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

export const metadata: Metadata = {
  title: "Ask",
};

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export default async function ArchitectureNestedAskPage({
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

  return <ArchitectureNestedAskPageClient architectureId={resolved.architectureId} />;
}
