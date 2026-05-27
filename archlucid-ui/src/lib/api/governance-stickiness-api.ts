import { apiGet, apiPostJson } from "@/lib/api-client";
import { ApiV1Routes } from "@/lib/api-v1-routes";

export type FindingDispositionKind =
  | "Accepted"
  | "Deferred"
  | "NeedsEvidence"
  | "Remediated"
  | "RejectedAsNotApplicable";

export type ArchitectureRiskRegisterEntry = {
  findingId: string;
  runId?: string | null;
  manifestId?: string | null;
  title: string;
  severity: string;
  category: string;
  statusLabel: string;
  ownerUserId?: string | null;
  latestDisposition?: FindingDispositionKind | null;
  revisitDueUtc?: string | null;
  lastReviewedUtc?: string | null;
  agingDays: number;
  waiverExpiresAtUtc?: string | null;
  isStale: boolean;
  evidenceHref: string;
};

export type ArchitectureRiskRegisterResponse = {
  entries: ArchitectureRiskRegisterEntry[];
};

export type ArchitectureDecisionRegisterEntry = {
  decisionId: string;
  manifestId: string;
  runId: string;
  category: string;
  title: string;
  selectedOption: string;
  rationale: string;
  confidence?: number | null;
  confidenceSource?: string | null;
  recordedAtUtc: string;
  supportingFindingIds: string[];
};

export type ArchitectureDecisionRegisterResponse = {
  decisions: ArchitectureDecisionRegisterEntry[];
};

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

export async function getArchitectureRiskRegister(projectId?: string): Promise<ArchitectureRiskRegisterResponse> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitectureRiskRegisterResponse>(`${governanceBase()}/risk-register${suffix}`);
}

export async function getArchitectureDecisionRegister(
  projectId?: string,
): Promise<ArchitectureDecisionRegisterResponse> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitectureDecisionRegisterResponse>(`${governanceBase()}/decision-register${suffix}`);
}

export async function recordFindingDisposition(
  findingId: string,
  body: {
    disposition: FindingDispositionKind;
    rationale?: string;
    runId?: string;
    revisitDueUtc?: string;
    evidenceRequestText?: string;
  },
): Promise<void> {
  await apiPostJson<void>(`${governanceBase()}/findings/${encodeURIComponent(findingId)}/dispositions`, body);
}
