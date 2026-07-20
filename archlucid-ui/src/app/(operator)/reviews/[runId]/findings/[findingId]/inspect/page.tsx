import { permanentRedirect } from "next/navigation";

import { getFindingEvidenceTraceHref } from "@/lib/finding-evidence-navigation";

export { generateMetadata } from "../evidence-trace/page";

/**
 * Legacy inspect URL — permanently redirects to the canonical evidence-trace route.
 * Rendering is not duplicated; see {@link ../evidence-trace/page.tsx}.
 */
export default async function FindingInspectLegacyRedirectPage({
  params,
}: {
  params: Promise<{ runId: string; findingId: string }>;
}) {
  const { runId, findingId } = await params;

  permanentRedirect(getFindingEvidenceTraceHref(runId, findingId));
}
