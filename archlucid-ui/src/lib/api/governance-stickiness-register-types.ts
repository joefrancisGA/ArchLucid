import { ApiV1Routes } from "@/lib/api-v1-routes";

import type { FindingDispositionKind } from "./governance-stickiness-disposition-types";

export type ArchitectureRiskRegisterEntry = {
  findingId: string;
  runId?: string | null;
  manifestId?: string | null;
  title: string;
  severity: string;
  category: string;
  statusLabel: string;
  ownerUserId?: string | null;
  assignedToUserId?: string | null;
  latestDisposition?: FindingDispositionKind | null;
  revisitDueUtc?: string | null;
  remediationDueUtc?: string | null;
  lastReviewedUtc?: string | null;
  agingDays: number;
  waiverExpiresAtUtc?: string | null;
  isStale: boolean;
  evidenceHref: string;
  humanReviewStatus?: number | null;
  itsmLinkedTicketsSummary?: string | null;
  systemName?: string | null;
  resourceId?: string | null;
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
  buyerConfidenceSource?: string | null;
  recordedAtUtc: string;
  supportingFindingIds: string[];
};

export type ArchitectureDecisionRegisterResponse = {
  decisions: ArchitectureDecisionRegisterEntry[];
};

export type GovernanceReviewAwaitingActionItem = {
  runId: string;
  name: string;
  executedUtc?: string | null;
  sourceRunId: string;
  newFindingCount: number;
};

export type GovernanceReviewsAwaitingActionResponse = {
  items: GovernanceReviewAwaitingActionItem[];
};

export type GovernanceAssignedToMeFindingsCountResponse = {
  count: number;
};

export type RealizedValueSummary = {
  findingsRemediatedCount30Days: number;
  medianTimeToRemediationDays?: number | null;
  activeWaiversCount: number;
  waiversRetiredCount30Days: number;
  waiverExpiryReversionCount30Days: number;
  attestedIncidentsAvoided?: number | null;
  attestedRevenueOrRetentionImpact?: string | null;
  attestedReviewerTimeSavedNote?: string | null;
};

export type UpsertRealizedValueAttestationRequest = {
  attestedIncidentsAvoided?: number | null;
  attestedRevenueOrRetentionImpact?: string | null;
  attestedReviewerTimeSavedNote?: string | null;
};

export type ArchitectureDecisionRegisterFilters = {
  category?: string;
  recordedAfterUtc?: string;
  recordedBeforeUtc?: string;
  minConfidence?: number;
  maxConfidence?: number;
  buyerConfidenceSource?: string;
};

export type ArchitectureRiskRegisterQueryOptions = {
  projectId?: string;
  assignedToMe?: boolean;
  maxRows?: number;
};

export const governanceStickinessBase = (): string => `/${ApiV1Routes.governance}`;
