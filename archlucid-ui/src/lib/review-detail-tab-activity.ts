import { resolveLatestActivityAtUtc, resolveFindingActivityAtUtc } from "@/lib/findings/finding-activity-at-utc";
import { deriveLastEvaluatedLabel } from "@/lib/run-detail-workspace-derive";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { ManifestSummary, RunDetail } from "@/types/authority";

export type ReviewDetailTabActivityAt = Partial<Record<ReviewDetailTabId, string | null>>;

export type DeriveReviewDetailTabActivityInput = {
  readonly run: RunDetail["run"];
  readonly manifestSummary: ManifestSummary | null;
  readonly manifestId: string | null | undefined;
  readonly findings: readonly QuickDecisionFinding[];
  readonly operatorGovernanceDecisionUtc: string | null | undefined;
};

function maxFindingActivityAt(findings: readonly QuickDecisionFinding[]): string | null {
  const candidates = findings.map((finding) => resolveFindingActivityAtUtc(finding.aiReasoning));

  return resolveLatestActivityAtUtc(candidates);
}

/** Maps each review workspace tab to the latest known activity timestamp in that band. */
export function deriveReviewDetailTabActivityAt(
  input: DeriveReviewDetailTabActivityInput,
): ReviewDetailTabActivityAt {
  const lastEvaluatedUtc = deriveLastEvaluatedLabel(input.run, input.manifestSummary);
  const manifestCreatedUtc = input.manifestSummary?.createdUtc?.trim() ?? null;
  const governanceDecisionUtc = input.operatorGovernanceDecisionUtc?.trim() ?? null;
  const findingActivityUtc = maxFindingActivityAt(input.findings);
  const hasManifest = (input.manifestId ?? "").trim().length > 0;

  return {
    overview: lastEvaluatedUtc,
    findings: resolveLatestActivityAtUtc([findingActivityUtc, lastEvaluatedUtc]),
    evidence: lastEvaluatedUtc,
    policies: manifestCreatedUtc,
    "decisions-remediation": resolveLatestActivityAtUtc([governanceDecisionUtc, findingActivityUtc]),
    "review-package": hasManifest ? manifestCreatedUtc : null,
    architecture: input.run.createdUtc,
    activity: resolveLatestActivityAtUtc([
      (input.run as { completedUtc?: string | null }).completedUtc ?? null,
      lastEvaluatedUtc,
    ]),
  };
}
