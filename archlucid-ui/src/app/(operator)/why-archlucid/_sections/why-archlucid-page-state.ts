import type { SponsorEvidencePackPayload, WhyArchLucidSnapshot } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type { RunExplanationSummary } from "@/types/explanation";
import type { TenantCostEstimateResponse } from "@/types/tenant-cost-estimate";

export type SectionError = {
  message: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
};

export type WhyArchLucidPageState = {
  snapshot: WhyArchLucidSnapshot | null;
  snapshotError: SectionError | null;
  monthlyCostEstimate: TenantCostEstimateResponse | null;
  measuredDisclaimer: string | null;
  reportMarkdown: string | null;
  reportMissing: boolean;
  reportError: SectionError | null;
  explanation: RunExplanationSummary | null;
  explanationError: SectionError | null;
  sponsorPack: SponsorEvidencePackPayload | null;
  sponsorPackError: SectionError | null;
  loading: boolean;
};

export const initialWhyArchLucidPageState: WhyArchLucidPageState = {
  snapshot: null,
  snapshotError: null,
  monthlyCostEstimate: null,
  measuredDisclaimer: null,
  reportMarkdown: null,
  reportMissing: false,
  reportError: null,
  explanation: null,
  explanationError: null,
  sponsorPack: null,
  sponsorPackError: null,
  loading: true,
};
