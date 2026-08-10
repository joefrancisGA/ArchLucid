import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { DECISION_REGISTER_CANONICAL_PATH } from "@/lib/decision-register-evidence-copy";
import {
  buildGovernanceFindingsQueueHref,
  type MetricCountPresentation,
} from "@/lib/metric-count-presentation";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance-route-paths";
import type { GovernanceLineageManifestSummary, GovernanceLineageResult } from "@/types/governance-dashboard";

export type GovernanceLineageStatusTagPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export type GovernanceLineageVersionAssertion = {
  readonly primaryVersion: string | null;
  readonly approvedAndPromotedMatch: boolean | null;
  readonly assertionLabel: string;
};

export type GovernanceLineageSpineStep = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly statusTag?: GovernanceLineageStatusTagPresentation;
};

function normalizedStatusToken(value: string): string {
  return value.trim().toLowerCase();
}

/** Maps governance approval API status strings to canonical StatusTag presentation. */
export function governanceApprovalStatusTagPresentation(status: string): GovernanceLineageStatusTagPresentation {
  const normalized = normalizedStatusToken(status);

  if (normalized === "approved") {
    return { kind: "approved", label: "Approved" };
  }

  if (normalized === "submitted" || normalized === "pending" || normalized === "inreview") {
    return { kind: "in-progress", label: status.trim().length > 0 ? status.trim() : "In review" };
  }

  if (normalized === "rejected" || normalized === "denied") {
    return { kind: "blocked", label: normalized === "denied" ? "Denied" : "Rejected" };
  }

  if (normalized === "draft") {
    return { kind: "draft", label: "Draft" };
  }

  const label = status.trim();

  return { kind: "neutral", label: label.length > 0 ? label : "—" };
}

/** Maps risk posture strings to canonical StatusTag presentation. */
export function governanceRiskPostureStatusTagPresentation(
  riskPosture: string,
): GovernanceLineageStatusTagPresentation {
  const normalized = normalizedStatusToken(riskPosture);

  if (normalized.includes("approved with monitoring") || normalized.includes("monitoring")) {
    return { kind: "approved-with-monitoring", label: riskPosture.trim() };
  }

  if (normalized === "approved") {
    return { kind: "approved", label: "Approved" };
  }

  if (normalized === "critical") {
    return { kind: "blocked", label: riskPosture.trim() };
  }

  if (normalized === "high" || normalized === "elevated" || normalized === "medium") {
    return { kind: "needs-attention", label: riskPosture.trim() };
  }

  if (normalized === "low") {
    return { kind: "ready", label: riskPosture.trim() };
  }

  const label = riskPosture.trim();

  return { kind: "neutral", label: label.length > 0 ? label : "—" };
}

/** Maps architecture review checkpoint run status strings to StatusTag presentation. */
export function governanceLineageReviewCheckpointStatusTagPresentation(
  status: string,
): GovernanceLineageStatusTagPresentation {
  const normalized = normalizedStatusToken(status);

  if (normalized === "finalized" || normalized === "completed" || normalized === "committed") {
    return { kind: "ready", label: status.trim().length > 0 ? status.trim() : "Finalized" };
  }

  if (
    normalized === "failed" ||
    normalized === "executioncompletedqualityrejected" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return { kind: "blocked", label: status.trim().length > 0 ? status.trim() : "Failed" };
  }

  if (
    normalized === "inprogress" ||
    normalized === "in progress" ||
    normalized === "running" ||
    normalized === "partiallycompleted"
  ) {
    return { kind: "in-progress", label: status.trim().length > 0 ? status.trim() : "In progress" };
  }

  if (normalized === "draft" || normalized === "starting") {
    return { kind: "draft", label: status.trim().length > 0 ? status.trim() : "Draft" };
  }

  const label = status.trim();

  return { kind: "neutral", label: label.length > 0 ? label : "—" };
}

/** Maps signed review record verification status to StatusTag presentation. */
export function governanceLineageVerificationStatusTagPresentation(
  verificationStatus: string,
): GovernanceLineageStatusTagPresentation {
  const normalized = normalizedStatusToken(verificationStatus);

  if (normalized === "verified" || normalized === "valid") {
    return { kind: "ready", label: "Verified" };
  }

  if (normalized === "failed" || normalized === "invalid") {
    return { kind: "blocked", label: normalized === "invalid" ? "Invalid" : "Failed" };
  }

  if (normalized === "pending" || normalized === "in progress" || normalized === "in-progress") {
    return { kind: "in-progress", label: "Pending verification" };
  }

  const label = verificationStatus.trim();

  return { kind: "neutral", label: label.length > 0 ? label : "—" };
}

function trimVersion(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();

  return trimmed.length > 0 ? trimmed : null;
}

/** Derives the single primary version and whether approved/promoted versions align. */
export function deriveGovernanceLineageVersionAssertion(
  data: GovernanceLineageResult,
): GovernanceLineageVersionAssertion {
  const approvedVersion = trimVersion(data.approvalRequest.manifestVersion);
  const manifestVersion = trimVersion(data.manifest?.manifestVersion);
  const primaryVersion = manifestVersion ?? approvedVersion;
  const latestPromotionVersion = trimVersion(data.promotions[0]?.manifestVersion);
  const knownVersions = [approvedVersion, manifestVersion, latestPromotionVersion].filter(
    (version): version is string => version !== null,
  );
  const uniqueKnownVersions = new Set(knownVersions);

  let approvedAndPromotedMatch: boolean | null = null;

  if (knownVersions.length >= 2) {
    approvedAndPromotedMatch = uniqueKnownVersions.size === 1;
  }

  let assertionLabel: string;

  if (approvedAndPromotedMatch === true) {
    assertionLabel = "Approved and promoted versions match.";
  } else if (approvedAndPromotedMatch === false) {
    assertionLabel = "Approved and promoted versions do not match — investigate before relying on this lineage.";
  } else if (data.promotions.length === 0) {
    assertionLabel = "Promotion not recorded yet for this approval.";
  } else if (primaryVersion !== null) {
    assertionLabel = "Version alignment could not be determined from the available promotion records.";
  } else {
    assertionLabel = "Signed review record version not available.";
  }

  return {
    primaryVersion,
    approvedAndPromotedMatch,
    assertionLabel,
  };
}

/** Parent approval-queue href scoped to the originating review. */
export function governanceApprovalRequestParentHref(runId: string): string {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return `${GOVERNANCE_APPROVAL_QUEUE_PATH}#governance-approval-requests`;
  }

  return `${GOVERNANCE_APPROVAL_QUEUE_PATH}?runId=${encodeURIComponent(trimmedRunId)}#governance-approval-requests`;
}

export function governanceLineageDecisionCountPresentation(
  count: number,
  _runId: string,
): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "decision" : "decisions",
    dimensions: [{ kind: "workspace" }],
    href: DECISION_REGISTER_CANONICAL_PATH,
  };
}

export function governanceLineageUnresolvedIssuesPresentation(
  count: number,
  runId: string,
): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "unresolved issue" : "unresolved issues",
    dimensions: [{ kind: "this-review" }, { kind: "governance-filter", filter: "open" }],
    href: buildGovernanceFindingsQueueHref({
      runId: runId.trim().length > 0 ? runId : null,
      filter: "open",
    }),
  };
}

export function governanceLineageComplianceGapsPresentation(
  count: number,
  runId: string,
): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "compliance gap" : "compliance gaps",
    dimensions: [{ kind: "this-review" }, { kind: "governance-filter", filter: "open" }],
    href: buildGovernanceFindingsQueueHref({
      runId: runId.trim().length > 0 ? runId : null,
      filter: "open",
    }),
  };
}

/** Manifest metric rows — each count maps to a distinct manifest property for tests and rendering. */
export type GovernanceLineageManifestMetricField = {
  readonly label: string;
  readonly manifestProperty: keyof Pick<
    GovernanceLineageManifestSummary,
    "decisionCount" | "unresolvedIssueCount" | "complianceGapCount"
  >;
  readonly presentation: MetricCountPresentation;
};

export function buildGovernanceLineageManifestMetricFields(input: {
  readonly manifest: GovernanceLineageManifestSummary;
  readonly runId: string;
}): readonly GovernanceLineageManifestMetricField[] {
  const { manifest, runId } = input;

  return [
    {
      label: "Decisions",
      manifestProperty: "decisionCount",
      presentation: governanceLineageDecisionCountPresentation(manifest.decisionCount, runId),
    },
    {
      label: "Unresolved issues",
      manifestProperty: "unresolvedIssueCount",
      presentation: governanceLineageUnresolvedIssuesPresentation(manifest.unresolvedIssueCount, runId),
    },
    {
      label: "Compliance gaps",
      manifestProperty: "complianceGapCount",
      presentation: governanceLineageComplianceGapsPresentation(manifest.complianceGapCount, runId),
    },
  ];
}
