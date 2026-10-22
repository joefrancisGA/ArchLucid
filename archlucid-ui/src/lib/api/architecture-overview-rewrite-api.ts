import { apiPostJson } from "./http";
import type { ArchitectureDraftStructuredBriefState } from "@/lib/architecture/architecture-draft-structured-brief";
import { structuredBriefToPatchPayload } from "@/lib/architecture/architecture-draft-structured-brief";

/** Matches API minimum for POST /v1/architecture/request/draft/overview-rewrite. */
export const ARCHITECTURE_OVERVIEW_REWRITE_MIN_OVERVIEW_CHARS = 20;

/** Body for POST /v1/architecture/request/draft/overview-rewrite. */
export type RewriteArchitectureOverviewInput = {
  currentOverview: string;
  systemName?: string;
  businessOutcome?: string;
  structuredBrief: NonNullable<ReturnType<typeof structuredBriefToPatchPayload>>;
};

/** Proposed overview from the conservative rewrite pass. */
export type RewriteArchitectureOverviewResponse = {
  rewrittenOverview: string;
};

/** Calls POST /v1/architecture/request/draft/overview-rewrite. */
export async function rewriteArchitectureOverviewFromBrief(
  input: RewriteArchitectureOverviewInput,
): Promise<RewriteArchitectureOverviewResponse> {
  return apiPostJson<RewriteArchitectureOverviewResponse>("/v1/architecture/request/draft/overview-rewrite", input);
}

export function buildRewriteArchitectureOverviewInput(input: {
  readonly currentOverview: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
}): RewriteArchitectureOverviewInput {
  return {
    currentOverview: input.currentOverview,
    systemName: input.systemName?.trim() || undefined,
    businessOutcome: input.businessOutcome?.trim() || undefined,
    structuredBrief: structuredBriefToPatchPayload(input.structuredBrief),
  };
}
